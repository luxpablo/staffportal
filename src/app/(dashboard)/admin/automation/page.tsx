"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Webhook, Key, Settings, Plug } from "lucide-react";

export default function Automation(){
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Webhook className="h-6 w-6 text-indigo-600"/> Automation — Webhooks & API Keys</h1>
        <p className="text-sm text-muted-foreground">Secure API key management, webhooks, integrations — founder only for secrets</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4"/> Webhooks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">Events: User created/updated, Staff accepted, Task created/completed, Meeting created, Announcement published, Payout completed</div>
            <div className="space-y-1"><Label>Endpoint URL</Label><Input placeholder="https://your.app/webhook" /></div>
            <div className="space-y-1"><Label>Secret</Label><Input type="password" placeholder="whsec_..." /></div>
            <Button size="sm">Create Webhook</Button>
            <div className="text-xs text-muted-foreground">Never expose secrets to frontend — stored encrypted, hash API keys.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4"/> API Keys</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">Create key with scopes, expiration, last used, revoke/rotate. Full key shown only once.</div>
            <div className="space-y-1"><Label>Name</Label><Input placeholder="CI/CD Key" /></div>
            <div className="space-y-1"><Label>Scopes</Label><Input placeholder="tasks:read, payouts:read" /></div>
            <Button size="sm">Create Key</Button>
            <div className="text-xs text-muted-foreground">Hashed in DB, never display full key again.</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4"/> Integrations</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["WHMCS","Paymenter","Pterodactyl","Discord","SMTP","GitHub","Cloudflare"].map(i=> <Badge key={i} variant="secondary">{i}</Badge>)}
        </CardContent>
      </Card>
    </div>
  );
}
