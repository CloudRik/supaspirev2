import { create } from 'zustand';
import { type Project } from '@/lib/projects';

export type Workspace = { id: string; name: string; type: string; role?: string; avatarUrl?: string | null };

interface ProjectState {
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  activeWorkspace: string;
  setActiveWorkspace: (wId: string) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  activeProject: string | null;
  setActiveProject: (project: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  activeWorkspace: typeof window !== 'undefined' ? localStorage.getItem('cloudrik-workspace') || '' : '',
  setActiveWorkspace: (wId) => {
    if (wId) {
      localStorage.setItem('cloudrik-workspace', wId);
    } else {
      localStorage.removeItem('cloudrik-workspace');
    }
    set({ activeWorkspace: wId });
  },
  projects: [],
  setProjects: (projects) => set({ projects }),
  activeProject: typeof window !== 'undefined' ? localStorage.getItem('cloudrik-active-project') : null,
  setActiveProject: (project) => {
    if (project) {
      localStorage.setItem('cloudrik-active-project', project);
    } else {
      localStorage.removeItem('cloudrik-active-project');
    }
    set({ activeProject: project });
  },
}));
