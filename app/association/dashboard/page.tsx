"use client";

import {
  PawPrint,
  Plus,
  Inbox,
  Home,
  MessageCircle,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LogoutButton from "../../components/LogoutButton";

export default function AssociationDashboardPage() {
  const cards = [
    { title: "Mes animaux", icon: PawPrint, text: "Voir et modifier les fiches animaux.", action: "Voir" },
    { title: "Ajouter un animal", icon: Plus, text: "Créer une nouvelle fiche passeport.", action: "Ajouter" },
    { title: "Demandes d'adoption", icon: Inbox, text: "Suivre les demandes reçues.", action: "Gérer" },
    { title: "Familles d'accueil", icon: Home, text: "Gérer les familles disponibles.", action: "Voir" },
    { title: "Messages", icon: MessageCircle, text: "Discuter avec les adoptants.", action: "Ouvrir" },
    { title: "Rendez-vous", icon: CalendarDays, text: "Planifier les rencontres.", action: "Planifier" },
    { title: "Statistiques", icon: BarChart3, text: "Suivre l'activité de l'association.", action: "Voir" },
    { title: "Paramètres", icon: Settings, text: "Modifier le profil association.", action: "Modifier" },
  ];

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black">Dashboard Association</h1>
            <p className="mt-2 text-lg text-gray-500">
              Gérez vos animaux, demandes et familles d'accueil.
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <p className="text-gray-500 font-bold">Animaux publiés</p>
            <h2 className="mt-2 text-5xl font-black">1</h2>
          </Card>

          <Card>
            <p className="text-gray-500 font-bold">Demandes en attente</p>
            <h2 className="mt-2 text-5xl font-black">0</h2>
          </Card>

          <Card>
            <p className="text-gray-500 font-bold">Adoptions finalisées</p>
            <h2 className="mt-2 text-5xl font-black">0</h2>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="space-y-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dff5ee]">
                  <Icon size={32} />
                </div>

                <h2 className="text-2xl font-black">{item.title}</h2>

                <p className="min-h-[50px] text-gray-500">{item.text}</p>

                <Button variant="secondary" className="w-full">
                  {item.action}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}