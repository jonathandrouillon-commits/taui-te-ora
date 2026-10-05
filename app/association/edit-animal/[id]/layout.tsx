import type {
  ReactNode,
} from "react";

import EditAnimalPhotoManager from "./EditAnimalPhotoManager";

type EditAnimalLayoutProps = {
  children: ReactNode;

  params: Promise<{
    id: string;
  }>;
};

export default async function EditAnimalLayout({
  children,
  params,
}: EditAnimalLayoutProps) {
  const { id } =
    await params;

  return (
    <>
      {children}

      <EditAnimalPhotoManager
        animalId={id}
      />
    </>
  );
}