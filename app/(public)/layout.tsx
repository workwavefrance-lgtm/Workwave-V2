import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DevBanner from "@/components/ui/DevBanner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <DevBanner />
    </>
  );
}
