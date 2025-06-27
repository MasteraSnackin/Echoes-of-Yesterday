import { DashboardHeader } from "@/components/dashboard-header";
import { ImageTo3dForm } from "@/components/features/image-to-3d-form";

export default function ImageTo3dPage() {
  return (
    <>
      <DashboardHeader
        title="Image to 3D"
        description="Generate a 3D model from a single image."
      />
      <main className="flex-1 p-6">
        <ImageTo3dForm />
      </main>
    </>
  );
}
