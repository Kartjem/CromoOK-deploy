import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NavTop() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 transition-transform group-data-[state=collapsed]/sidebar-wrapper:-translate-x-4 group-data-[state=expanded]/sidebar-wrapper:translate-x-0" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
    </header>
  );
}
