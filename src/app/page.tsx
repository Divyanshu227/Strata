import DashboardClient from './DashboardClient';
import { getOrCreateDefaultProject } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const project = await getOrCreateDefaultProject();

  return (
    <DashboardClient
      initialProject={project}
    />
  );
}
