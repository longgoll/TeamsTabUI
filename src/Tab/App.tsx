import React from "react";
import * as teamsJs from "@microsoft/teams-js";

import "./App.css";
import { DirectoryFilters } from "./components/DirectoryFilters";
import { EmployeeDirectoryGrid } from "./components/EmployeeDirectoryGrid";
import { PageHeader } from "./components/PageHeader";
import { ProfileModal } from "./components/ProfileModal";
import type { EmployeeProfile } from "./types";

const EMPLOYEE_PROFILES: EmployeeProfile[] = [
];

export default function App() {
  // const [content, setContent] = React.useState("");
  const [theme, setTheme] = React.useState("default");
  const [isTeamsInitialized, setIsTeamsInitialized] = React.useState(false);
  const [teamsInitError, setTeamsInitError] = React.useState<string | null>(null);
  const [profiles, setProfiles] = React.useState<EmployeeProfile[]>(EMPLOYEE_PROFILES);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [keyword, setKeyword] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [titleFilter, setTitleFilter] = React.useState("all");
  const [skillFilter, setSkillFilter] = React.useState("all");
  const [selectedProfile, setSelectedProfile] = React.useState<EmployeeProfile | null>(null);
  const [teamGroupId, setTeamGroupId] = React.useState<string | null>(null);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const departmentOptions = React.useMemo(() => ["all", ...new Set(profiles.map((p) => p.department).filter(Boolean))], [profiles]);
  const titleOptions = React.useMemo(() => ["all", ...new Set(profiles.map((p) => p.title).filter(Boolean))], [profiles]);
  const skillOptions = React.useMemo(() => ["all", ...new Set(profiles.flatMap((p) => p.skills).filter(Boolean))], [profiles]);

  React.useEffect(() => {
    const themeHandler: teamsJs.app.themeHandler = (nextTheme: string) => {
      if (isMountedRef.current) setTheme(nextTheme);
    };

    const initialize = async () => {
      try {
        setTeamsInitError(null);
        await teamsJs.app.initialize();
        const context = await teamsJs.app.getContext();

        if (!isMountedRef.current) return;
        if (context?.app?.theme) setTheme(context.app.theme);
        if (context?.team?.groupId) setTeamGroupId(context.team.groupId);

        if (typeof teamsJs.app.registerOnThemeChangeHandler === "function") {
          teamsJs.app.registerOnThemeChangeHandler(themeHandler);
        }
        setIsTeamsInitialized(true);
      } catch (error) {
        if (isMountedRef.current) {
          setTeamsInitError("Unable to initialize the Teams SDK.");
        }
      }
    };
    void initialize();
  }, []);

  const fetchGraphData = React.useCallback(async (groupId?: string | null, isSilentRefresh = false) => {
    try {
      if (isSilentRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const url = groupId ? `/api/members?groupId=${groupId}` : `/api/members`;
      const response = await fetch(url);
      const usersData = await response.json();

      if (usersData && usersData.value && isMountedRef.current) {
        const realProfiles = usersData.value.map((user: any) => ({
          id: user.id || Math.random().toString(),
          name: user.displayName || "Unknown Member",
          title: user.jobTitle || "",
          department: user.department || "",
          expertise: (user.expertise || []).filter(Boolean),
          skills: (user.skills || []).filter(Boolean),
          email: user.mail || user.userPrincipalName || "",
          avatarUrl: user.avatarUrl || "",
          presence: user.presence || "",
          location: user.location || "",
          rawStatus: user.rawStatus || "",
        }));

        setProfiles(realProfiles);
      }
    } catch (error) {
      console.error("Fetch members failed", error);
    } finally {
      if (isSilentRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isTeamsInitialized) return;
    
    // Initial fetch
    void fetchGraphData(teamGroupId);

    // Auto-sync every 30 seconds to keep presence almost real-time without user action
    const interval = setInterval(() => {
      void fetchGraphData(teamGroupId, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [isTeamsInitialized, teamGroupId, fetchGraphData]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.setAttribute("data-teams-theme", theme ?? "default");
  }, [theme]);

  React.useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-teams-theme");
      }
    };
  }, []);

  const filteredProfiles = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return profiles.filter((person) => {
      const matchesDepartment = departmentFilter === "all" || person.department === departmentFilter;
      const matchesTitle = titleFilter === "all" || person.title === titleFilter;
      const matchesSkill = skillFilter === "all" || person.skills.includes(skillFilter);
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        person.name.toLowerCase().includes(normalizedKeyword) ||
        person.skills.some((skill) => skill.toLowerCase().includes(normalizedKeyword));

      return matchesDepartment && matchesTitle && matchesSkill && matchesKeyword;
    });
  }, [departmentFilter, keyword, profiles, skillFilter, titleFilter]);

  const openChat = async (email: string) => {
    const chatDeepLink = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}`;

    try {
      await teamsJs.app.openLink(chatDeepLink);
    } catch {
      window.open(chatDeepLink, "_blank", "noopener,noreferrer");
    }
  };

  if (teamsInitError) {
    return (
      <div className="min-h-screen bg-(--color-page) px-4 py-8 text-(--color-text-primary)">
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-5">
          <h2 className="text-lg font-semibold">Teams SDK initialization failed</h2>
          <p className="mt-2 text-sm text-(--color-text-secondary)">{teamsInitError}</p>
        </div>
      </div>
    );
  }

  if (!isTeamsInitialized) {
    return (
      <div className="min-h-screen bg-(--color-page) px-4 py-8 text-(--color-text-primary)">
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-(--color-border) bg-(--color-surface) p-5 text-sm text-(--color-text-secondary)">
          Đang khởi tạo ứng dụng Teams...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-page) px-4 py-8 text-(--color-text-primary) transition-colors duration-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader />

        {/* <HostBanner content={content} /> */}

        <DirectoryFilters
          keyword={keyword}
          departmentFilter={departmentFilter}
          titleFilter={titleFilter}
          skillFilter={skillFilter}
          departmentOptions={departmentOptions}
          titleOptions={titleOptions}
          skillOptions={skillOptions}
          onKeywordChange={setKeyword}
          onDepartmentChange={setDepartmentFilter}
          onTitleChange={setTitleFilter}
          onSkillChange={setSkillFilter}
        />

        <EmployeeDirectoryGrid
          isLoading={isLoading}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-[minmax(24rem,1fr)]"
          profiles={filteredProfiles}
          onView={(profile) => setSelectedProfile(profile)}
          onChat={openChat}
        />
      </div>

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onChat={openChat}
        />
      )}
    </div>
  );
}
