import React from "react";
import * as teamsJs from "@microsoft/teams-js";

import "./App.css";
import { DirectoryFilters } from "./components/DirectoryFilters";
import { EmployeeDirectoryGrid } from "./components/EmployeeDirectoryGrid";
import { PageHeader } from "./components/PageHeader";
import { ProfileModal } from "./components/ProfileModal";
import type { EmployeeProfile } from "./types";

const EMPLOYEE_PROFILES: EmployeeProfile[] = [
  {
    id: "hoang-long",
    name: "Hoang Long samble",
    title: "Frontend Engineer",
    department: "Digital Product",
    expertise: ["Interface design", "Performance optimization", "Dashboard development"],
    skills: ["React", "Vite", "CSS", "Figma"],
    email: "long-hoang@rgz5.onmicrosoft.com",
    avatarUrl: "",
    presence: "Available",
    location: "HQ",
    rawStatus: "Building awesome interfaces"
  }
];

export default function App() {
  // const [content, setContent] = React.useState("");
  const [theme, setTheme] = React.useState("default");
  const [isTeamsInitialized, setIsTeamsInitialized] = React.useState(false);
  const [teamsInitError, setTeamsInitError] = React.useState<string | null>(null);
  const [profiles, setProfiles] = React.useState<EmployeeProfile[]>(EMPLOYEE_PROFILES);
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

  const departmentOptions = React.useMemo(() => ["all", ...new Set(profiles.map((person) => person.department))], [profiles]);

  const titleOptions = React.useMemo(() => ["all", ...new Set(profiles.map((person) => person.title))], [profiles]);

  const skillOptions = React.useMemo(() => ["all", ...new Set(profiles.flatMap((person) => person.skills))], [profiles]);

  React.useEffect(() => {
    const themeHandler: teamsJs.app.themeHandler = (nextTheme: string) => {
      if (isMountedRef.current) {
        setTheme(nextTheme);
      }
    };

    const initialize = async () => {
      try {
        setTeamsInitError(null);
        await teamsJs.app.initialize();
        const context = await teamsJs.app.getContext();

        if (!isMountedRef.current) {
          return;
        }

        if (context?.app?.theme) {
          setTheme(context.app.theme);
        }

        if (context?.team?.groupId) {
          setTeamGroupId(context.team.groupId);
        }

        if (typeof teamsJs.app.registerOnThemeChangeHandler === "function") {
          teamsJs.app.registerOnThemeChangeHandler(themeHandler);
        }

        setIsTeamsInitialized(true);
      } catch (error) {
        console.error("Teams initialization failed", error);
        if (isMountedRef.current) {
          setTeamsInitError("Unable to initialize the Teams SDK. Please open the app in Microsoft Teams and check the manifest/domain again.");
        }
      }
    };
    void initialize();
  }, []);

  const fetchGraphData = React.useCallback(async (groupId?: string | null) => {
    try {
      const url = groupId 
        ? `/api/members?groupId=${groupId}` 
        : `/api/members`;

      const response = await fetch(url);
      const usersData = await response.json();

      if (usersData && usersData.value && isMountedRef.current) {
        const realProfiles = usersData.value.map((user: any) => ({
          id: user.id,
          name: user.displayName,
          title: user.jobTitle || "",
          department: user.department || "",
          expertise: user.expertise || [],
          skills: user.skills || [],
          email: user.mail || user.userPrincipalName || "",
          avatarUrl: user.avatarUrl || "",
          presence: user.presence || "",
          location: user.location || "",
          rawStatus: user.rawStatus || "",
        }));

        setProfiles((prev) => {
          const combined = [...realProfiles];
          prev.forEach((p) => {
            if (!combined.some((rp) => rp.id === p.id)) {
              combined.push(p);
            }
          });
          return combined;
        });
      }
    } catch (error) {
      console.error("Fetch members failed", error);
    }
  }, []);

  React.useEffect(() => {
    if (isTeamsInitialized) {
      void fetchGraphData(teamGroupId);
    }
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
