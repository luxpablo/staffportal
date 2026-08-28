"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function IntegrationsPage(){
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Integrations</h1><p className="text-sm text-muted-foreground">Discord, SMTP, WHMCS, Paymenter, Pterodactyl — secrets stored securely, never exposed to frontend</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {name:"Discord", desc:"Bot token, Guild ID, channels for task/payout/announcement", fields:["DISCORD_BOT_TOKEN","DISCORD_GUILD_ID","DISCORD_CHANNEL_TASKS"]},
          {name:"SMTP / Email", desc:"Welcome, task, payout, announcement templates", fields:["SMTP_HOST","SMTP_USER","SMTP_PASSWORD"]},
          {name:"WHMCS", desc:"Billing sync, product mapping, commission auto-calc", fields:["WHMCS_API_URL","WHMCS_API_IDENTIFIER","WHMCS_API_SECRET"]},
          {name:"Paymenter", desc:"Alternative billing integration", fields:["PAYMENTER_API_URL","PAYMENTER_API_KEY"]},
          {name:"Pterodactyl", desc:"Game server automation", fields:["PTERODACTYL_API_URL","PTERODACTYL_API_KEY"]},
        ].map(i=>(
          <Card key={i.name}>
            <CardHeader><CardTitle className="text-base">{i.name}</CardTitle><p className="text-sm text-muted-foreground">{i.desc}</p></CardHeader>
            <CardContent className="space-y-3">
              {i.fields.map(f=> <div key={f} className="space-y-1"><Label className="text-xs">{f}</Label><Input type="password" placeholder="••••••••" defaultValue="" /></div>)}
              <div className="flex gap-2 pt-2"><Button size="sm">Save</Button><Button size="sm" variant="outline">Test Connection</Button></div>
              <p className="text-xs text-muted-foreground">Stored in Integration model, encrypted at rest. Never logged.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
