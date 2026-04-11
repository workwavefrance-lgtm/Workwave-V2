"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useCommandPalette } from "./CommandPaletteProvider";
import { STATIC_COMMANDS, type CommandItem } from "./command-groups";

type SearchResults = {
  pros: { id: number; name: string; slug: string }[];
  projects: { id: number; first_name: string }[];
};

function NavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8h11M8.5 3l5 5-5 5" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v12M2 8h12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5v5M14 2 8 8" />
    </svg>
  );
}

function getIcon(icon?: string) {
  if (icon === "action") return <ActionIcon />;
  if (icon === "search") return <SearchIcon />;
  return <NavIcon />;
}

function isExternal(href?: string) {
  return href?.startsWith("http://") || href?.startsWith("https://");
}

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults(null);
      setIsSearching(false);
    }
  }, [open]);

  // Debounced search
  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        // Silently fail — static commands still work
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    runSearch(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  function handleSelect(item: CommandItem) {
    if (!item.href) return;
    setOpen(false);
    if (isExternal(item.href)) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  }

  function handleSelectPro(slug: string) {
    setOpen(false);
    router.push(`/admin/pros?search=${encodeURIComponent(slug)}`);
  }

  function handleSelectProject(id: number) {
    setOpen(false);
    router.push(`/admin/projects/${id}`);
  }

  if (!open) return null;

  // Filter static commands by query (cmdk handles this natively via shouldFilter,
  // but we also pass the filter manually for group visibility control)
  const filteredStatic = query.trim()
    ? STATIC_COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : STATIC_COMMANDS;

  const navCommands = filteredStatic.filter((c) => c.group === "Navigation");
  const actionCommands = filteredStatic.filter((c) => c.group === "Actions");

  const hasPros = (searchResults?.pros?.length ?? 0) > 0;
  const hasProjects = (searchResults?.projects?.length ?? 0) > 0;

  return (
    <>
      <style>{`
        [cmdk-root] {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-height: 480px;
          overflow: hidden;
          border-radius: 12px;
          background: var(--admin-card);
          border: 1px solid var(--admin-border);
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          font-family: inherit;
        }
        [cmdk-input-wrapper] {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border-bottom: 1px solid var(--admin-border);
          flex-shrink: 0;
        }
        [cmdk-input] {
          width: 100%;
          height: 52px;
          background: transparent;
          border: none;
          outline: none;
          color: var(--admin-text);
          font-size: 14px;
          font-family: inherit;
          caret-color: var(--admin-accent);
        }
        [cmdk-input]::placeholder {
          color: var(--admin-text-tertiary);
        }
        [cmdk-list] {
          overflow-y: auto;
          max-height: 428px;
          padding: 6px;
          scroll-padding-block: 6px;
        }
        [cmdk-list]::-webkit-scrollbar {
          width: 4px;
        }
        [cmdk-list]::-webkit-scrollbar-thumb {
          background: var(--admin-border);
          border-radius: 2px;
        }
        [cmdk-group] {
          padding: 0;
        }
        [cmdk-group-heading] {
          padding: 6px 10px 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--admin-text-tertiary);
          user-select: none;
        }
        [cmdk-item] {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 6px;
          font-size: 13px;
          color: var(--admin-text);
          cursor: pointer;
          transition: background 150ms ease;
          user-select: none;
          outline: none;
        }
        [cmdk-item][data-selected="true"] {
          background: var(--admin-hover);
          color: var(--admin-text);
        }
        [cmdk-item] .cmd-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: var(--admin-hover);
          color: var(--admin-text-secondary);
          flex-shrink: 0;
        }
        [cmdk-item][data-selected="true"] .cmd-icon {
          background: rgba(16,185,129,0.12);
          color: var(--admin-accent);
        }
        [cmdk-item] .cmd-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [cmdk-item] .cmd-external {
          color: var(--admin-text-tertiary);
          flex-shrink: 0;
        }
        [cmdk-item] .cmd-shortcut {
          font-size: 11px;
          color: var(--admin-text-tertiary);
          flex-shrink: 0;
        }
        [cmdk-separator] {
          height: 1px;
          background: var(--admin-border);
          margin: 4px 0;
        }
        [cmdk-empty] {
          padding: 32px 16px;
          text-align: center;
          font-size: 13px;
          color: var(--admin-text-tertiary);
        }
        .cmd-searching {
          padding: 24px 16px;
          text-align: center;
          font-size: 13px;
          color: var(--admin-text-tertiary);
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "15vh",
        }}
      >
        {/* Dialog container — stop propagation so clicking inside doesn't close */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width: "100%", maxWidth: 560, padding: "0 16px" }}
        >
          <Command
            shouldFilter={false}
            label="Command palette"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <div data-cmdk-input-wrapper="">
              <span style={{ color: "var(--admin-text-tertiary)", flexShrink: 0, display: "flex" }}>
                <SearchIcon />
              </span>
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Rechercher ou naviguer..."
                autoFocus
              />
              <kbd
                style={{
                  fontSize: 11,
                  color: "var(--admin-text-tertiary)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 4,
                  padding: "2px 5px",
                  flexShrink: 0,
                  fontFamily: "inherit",
                }}
              >
                ESC
              </kbd>
            </div>

            <Command.List>
              {/* Loading state for search */}
              {isSearching && (
                <div className="cmd-searching">Recherche en cours...</div>
              )}

              {/* Static navigation commands */}
              {navCommands.length > 0 && (
                <Command.Group heading="Navigation">
                  {navCommands.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                    >
                      <span className="cmd-icon">{getIcon(item.icon)}</span>
                      <span className="cmd-label">{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Action commands */}
              {actionCommands.length > 0 && (
                <Command.Group heading="Actions">
                  {actionCommands.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                    >
                      <span className="cmd-icon">{getIcon(item.icon)}</span>
                      <span className="cmd-label">{item.label}</span>
                      {isExternal(item.href) && (
                        <span className="cmd-external">
                          <ExternalLinkIcon />
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Search results — pros */}
              {hasPros && (
                <Command.Group heading="Professionnels">
                  {searchResults!.pros.map((pro) => (
                    <Command.Item
                      key={`pro-${pro.id}`}
                      value={`pro-${pro.id}`}
                      onSelect={() => handleSelectPro(pro.slug)}
                    >
                      <span className="cmd-icon"><SearchIcon /></span>
                      <span className="cmd-label">{pro.name}</span>
                      <span className="cmd-shortcut" style={{ color: "var(--admin-text-tertiary)", fontSize: 11 }}>
                        Pro
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Search results — projects */}
              {hasProjects && (
                <Command.Group heading="Projets">
                  {searchResults!.projects.map((project) => (
                    <Command.Item
                      key={`project-${project.id}`}
                      value={`project-${project.id}`}
                      onSelect={() => handleSelectProject(project.id)}
                    >
                      <span className="cmd-icon"><SearchIcon /></span>
                      <span className="cmd-label">{project.first_name} — projet #{project.id}</span>
                      <span className="cmd-shortcut" style={{ color: "var(--admin-text-tertiary)", fontSize: 11 }}>
                        Projet
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Empty state */}
              {!isSearching &&
                navCommands.length === 0 &&
                actionCommands.length === 0 &&
                !hasPros &&
                !hasProjects && (
                  <Command.Empty>Aucun résultat pour &ldquo;{query}&rdquo;</Command.Empty>
                )}
            </Command.List>
          </Command>
        </div>
      </div>
    </>
  );
}
