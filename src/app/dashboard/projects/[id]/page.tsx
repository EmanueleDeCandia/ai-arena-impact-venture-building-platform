import { notFound } from "next/navigation";
import { ensureSeeded, loadProjectDTO, loadUsers } from "@/lib/loaders";
import { ProjectDetail } from "@/components/project-detail";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  const [project, users] = await Promise.all([loadProjectDTO(projectId), loadUsers()]);
  if (!project) notFound();

  return <ProjectDetail project={project} users={users} />;
}
