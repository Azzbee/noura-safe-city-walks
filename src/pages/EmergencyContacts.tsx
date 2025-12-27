import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEmergencyContacts, EmergencyContact, ContactFormData } from '@/hooks/useEmergencyContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Phone, Mail, Bell, Loader2, User } from 'lucide-react';

function ContactForm({
  contact,
  onSubmit,
  onClose,
}: {
  contact?: EmergencyContact;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [notifySms, setNotifySms] = useState(contact?.notify_sms ?? true);
  const [notifyEmail, setNotifyEmail] = useState(contact?.notify_email ?? true);
  const [notifyOnStart, setNotifyOnStart] = useState(contact?.notify_on_start ?? false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name,
      phone,
      email: email || undefined,
      notify_sms: notifySms,
      notify_email: notifyEmail,
      notify_on_start: notifyOnStart,
    });
    setLoading(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contact name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@email.com"
        />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="notify-sms" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Notify by SMS
          </Label>
          <Switch
            id="notify-sms"
            checked={notifySms}
            onCheckedChange={setNotifySms}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notify-email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Notify by Email
          </Label>
          <Switch
            id="notify-email"
            checked={notifyEmail}
            onCheckedChange={setNotifyEmail}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notify-start" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notify when journey starts
          </Label>
          <Switch
            id="notify-start"
            checked={notifyOnStart}
            onCheckedChange={setNotifyOnStart}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {contact ? 'Update Contact' : 'Add Contact'}
      </Button>
    </form>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.phone}</p>
              {contact.email && (
                <p className="text-sm text-muted-foreground">{contact.email}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove contact?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {contact.name} will no longer be notified in emergencies.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
          {contact.notify_sms && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> SMS
            </span>
          )}
          {contact.notify_email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </span>
          )}
          {contact.notify_on_start && (
            <span className="flex items-center gap-1">
              <Bell className="w-3 h-3" /> On start
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmergencyContacts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { contacts, loading, addContact, updateContact, deleteContact } = useEmergencyContacts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (data: ContactFormData) => {
    if (editingContact) {
      await updateContact(editingContact.id, data);
    } else {
      await addContact(data);
    }
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingContact(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Emergency Contacts</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardDescription>
              These contacts will be notified when you trigger an SOS or miss a check-in during your journey.
            </CardDescription>
          </CardHeader>
        </Card>

        {contacts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">No contacts yet</CardTitle>
              <CardDescription className="mb-4">
                Add emergency contacts to keep them informed during your journeys.
              </CardDescription>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Emergency Contact</DialogTitle>
                  </DialogHeader>
                  <ContactForm onSubmit={handleSubmit} onClose={closeDialog} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={() => openEditDialog(contact)}
                onDelete={() => deleteContact(contact.id)}
              />
            ))}

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) closeDialog();
              else setIsDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                  </DialogTitle>
                </DialogHeader>
                <ContactForm 
                  contact={editingContact ?? undefined} 
                  onSubmit={handleSubmit} 
                  onClose={closeDialog} 
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
}
