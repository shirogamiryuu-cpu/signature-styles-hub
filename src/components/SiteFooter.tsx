import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, MapPin, Phone, Clock } from "lucide-react";

export function SiteFooter() {
  const { data: info } = useQuery({
    queryKey: ["business_info"],
    queryFn: async () => {
      const { data } = await supabase.from("business_info").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  return (
    <footer className="mt-24 border-t bg-primary text-primary-foreground">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl">Signature Hair Stylist</h3>
          <p className="mt-2 text-sm opacity-80">
            A modern salon experience in the heart of Yangon.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          {info?.address && (
            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-accent" />{info.address}</p>
          )}
          {info?.phone1 && (
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" />{info.phone1}</p>
          )}
          {info?.phone2 && <p className="pl-6 opacity-80">{info.phone2}</p>}
          {info?.phone3 && <p className="pl-6 opacity-80">{info.phone3}</p>}
          {info?.opening_hours_text && (
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" />{info.opening_hours_text}</p>
          )}
          {info?.facebook_url && (
            <a href={info.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-accent">
              <Facebook className="h-4 w-4 text-accent" />Facebook
            </a>
          )}
        </div>
        {info?.google_maps_embed_link && (
          <div className="overflow-hidden rounded-md border border-white/10">
            <iframe
              src={info.google_maps_embed_link}
              className="h-44 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Salon map"
            />
          </div>
        )}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Signature Hair Stylist · Yangon
      </div>
    </footer>
  );
}
