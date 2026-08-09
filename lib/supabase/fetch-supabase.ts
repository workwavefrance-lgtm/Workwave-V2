/**
 * Le `fetch` utilise par nos clients Supabase cote serveur.
 *
 * POURQUOI CE FICHIER EXISTE (mesure le 09/08/2026)
 *
 * Next.js remplace le `fetch` global du serveur par le sien. Avant de rendre la
 * reponse, il la DEDOUBLE systematiquement :
 *
 *   node_modules/next/dist/server/lib/dedupe-fetch.js
 *     const [cloned1, cloned2] = cloneResponse(response);
 *     entry[2] = cloned2;   // gardee "au cas ou" la meme URL soit redemandee
 *     return cloned1;       // seule celle-ci est lue
 *
 *   node_modules/next/dist/server/lib/clone-response.js
 *     const [body1, body2] = original.body.tee();
 *     // "The Fetch Standard allows users to skip consuming the response body
 *     //  by relying on garbage collection to release connection resources."
 *
 * La branche gardee n'est lue que si EXACTEMENT la meme URL est refetchee
 * pendant le rendu de la meme page. Nos requetes Supabase etant presque toutes
 * uniques, elle est abandonnee a chaque fois — et n'est liberee que quand le
 * ramasse-miettes finit par declencher la FinalizationRegistry de Next.
 *
 * Sous le crawl continu de Google, ce moment n'arrive pas assez souvent.
 * Instantane du tas pris en production sur un processus d'UNE HEURE :
 *
 *     512 Mo    44 170 tampons  system / JSArrayBufferData
 *      57 Mo     7 446 tampons  retenus par InternalReadableByteStream
 *      90 Mo    11 500 tampons  retenus par WeakCell (= l attente du GC)
 *      15 Mo     1 954 tampons  retenus par forwardReaderError (= tee())
 *
 * Un ramassage force n'en liberait que 6 Mo : la retention est reelle.
 *
 * LA SORTIE, prevue par Next lui-meme (dedupe-fetch.js, tout en haut) :
 *
 *   if (options && options.signal) {
 *     // someone else controls the lifetime of this object and opts out of
 *     // caching. It's effectively the opt-out mechanism.
 *     return originalFetch(resource, options);
 *   }
 *
 * Une requete qui porte un signal n'est pas dedoublee. On en attache donc un a
 * toutes nos requetes Supabase.
 *
 * CE QU'ON PERD : Next ne regroupe plus deux requetes IDENTIQUES emises pendant
 * le rendu d'une meme page. Mesure avant de decider (voir `WW_TRACE_FETCH`
 * plus bas) : ce cas est marginal chez nous, nos requetes different par leur
 * filtre a chaque appel.
 *
 * CE QU'ON NE PERD PAS : le cache ISR des pages, le cache disque de Next, et le
 * cache de fetch cote `patch-fetch` — tout cela est en amont et reste actif.
 */

/**
 * Un signal frais par requete. Il n'est jamais declenche : son seul role est de
 * signaler a Next que nous gerons nous-memes la duree de vie de la reponse.
 * On evite un signal PARTAGE entre requetes : undici y attacherait un ecouteur
 * par appel, ce qui recreerait une fuite du meme genre.
 */
export function fetchSupabase(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  if (process.env.WW_TRACE_FETCH) {
    const url = typeof input === "string" ? input : input.toString();
    console.log("[fetch-supabase] " + url.slice(0, 300));
  }
  return fetch(input, {
    ...init,
    signal: init?.signal ?? new AbortController().signal,
  });
}
