import DashboardClient from './DashboardClient';
import AuthForm from './AuthForm';
import { getCurrentUser } from './actions';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    return <AuthForm />;
  }

  // Fetch all projects owned by the authenticated developer
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'asc' }
  });

  // Safe fallback if user somehow has no projects
  let projectList = projects;
  if (projects.length === 0) {
    const defaultProject = await prisma.project.create({
      data: {
        ownerId: user.id,
        name: 'My Platform',
        apiKey: `strata_token_${user.username}_${Math.random().toString(36).slice(2, 8)}`,
        platform: 'Default Portfolio',
        platformUrl: 'http://localhost:3000'
      }
    });
    projectList = [defaultProject];
  }

  return (
    <DashboardClient
      initialUser={user}
      initialProjects={projectList}
    />
  );
}
