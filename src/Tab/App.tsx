import React from "react";
import * as teamsJs from "@microsoft/teams-js";

import "./App.css";
import { DirectoryFilters } from "./components/DirectoryFilters";
import { EmployeeDirectoryGrid } from "./components/EmployeeDirectoryGrid";
import { PageHeader } from "./components/PageHeader";
import { ProfileFormModal } from "./components/ProfileFormModal";
import { ProfileModal } from "./components/ProfileModal";
import type { EmployeeProfile, ProfileFormData } from "./types";

const EMPLOYEE_PROFILES: EmployeeProfile[] = [
  {
    id: "thai-hien",
    name: "Thai Hien samble",
    title: "Software Solution Specialist",
    department: "Information Technology",
    expertise: ["Solution consulting", "Microsoft 365 integration", "Business analysis"],
    skills: ["Teams", "React", "TypeScript", "Power Platform"],
    email: "Thai-Hien-Phan@rgz5.onmicrosoft.com",
  },
  {
    id: "hoang-long",
    name: "Hoang Long samble",
    title: "Frontend Engineer",
    department: "Digital Product",
    expertise: ["Interface design", "Performance optimization", "Dashboard development"],
    skills: ["React", "Vite", "CSS", "Figma"],
    email: "long-hoang@rgz5.onmicrosoft.com",
  },
  {
    id: "hoang-huy",
    name: "Hoang Huy samble",
    title: "Project Manager",
    department: "Operations",
    expertise: ["Planning", "Schedule management", "Cross-team collaboration"],
    skills: ["Agile", "Scrum", "Jira", "Stakeholder Management"],
    email: "HoangHuy@rgz5.onmicrosoft.com",
  }
];

const EMPTY_FORM: ProfileFormData = {
  name: "",
  title: "",
  department: "",
  skillsText: "",
  expertiseText: "",
  email: "",
};

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const createIdFromName = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `profile-${Date.now()}`;

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
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProfileId, setEditingProfileId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<ProfileFormData>(EMPTY_FORM);
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

  const openCreateForm = () => {
    setEditingProfileId(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (profile: EmployeeProfile) => {
    setEditingProfileId(profile.id);
    setFormData({
      name: profile.name,
      title: profile.title,
      department: profile.department,
      skillsText: profile.skills.join(", "),
      expertiseText: profile.expertise.join(", "),
      email: profile.email,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProfileId(null);
    setFormData(EMPTY_FORM);
  };

  const deleteProfileById = React.useCallback((profileId: string) => {
    setProfiles((currentProfiles) => currentProfiles.filter((profile) => profile.id !== profileId));
    setSelectedProfile((current) => (current?.id === profileId ? null : current));
    setEditingProfileId((current) => (current === profileId ? null : current));
  }, []);

  const handleDeleteProfile = React.useCallback(
    (profile: EmployeeProfile) => {
      const shouldDelete = window.confirm(`Delete profile for ${profile.name}?`);
      if (!shouldDelete) {
        return;
      }

      deleteProfileById(profile.id);
    },
    [deleteProfileById]
  );

  const handleFormFieldChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextProfile: EmployeeProfile = {
      id: editingProfileId ?? createIdFromName(formData.name),
      name: formData.name.trim(),
      title: formData.title.trim(),
      department: formData.department.trim(),
      skills: parseList(formData.skillsText),
      expertise: parseList(formData.expertiseText),
      email: formData.email.trim(),
    };

    if (
      !nextProfile.name ||
      !nextProfile.title ||
      !nextProfile.department ||
      !nextProfile.email ||
      nextProfile.skills.length === 0
    ) {
      return;
    }

    setProfiles((currentProfiles) => {
      if (editingProfileId) {
        return currentProfiles.map((profile) => (profile.id === editingProfileId ? nextProfile : profile));
      }

      const hasDuplicateId = currentProfiles.some((profile) => profile.id === nextProfile.id);
      if (hasDuplicateId) {
        nextProfile.id = `${nextProfile.id}-${Date.now()}`;
      }

      return [nextProfile, ...currentProfiles];
    });

    setSelectedProfile((current) => (current && current.id === nextProfile.id ? nextProfile : current));
    closeForm();
  };

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
        <PageHeader onCreate={openCreateForm} />

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
          onEdit={openEditForm}
          onDelete={handleDeleteProfile}
          onChat={openChat}
        />
      </div>

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onEdit={(profile) => {
            openEditForm(profile);
            setSelectedProfile(null);
          }}
          onDelete={handleDeleteProfile}
          onChat={openChat}
        />
      )}

      <ProfileFormModal
        isOpen={isFormOpen}
        formData={formData}
        editingProfileId={editingProfileId}
        onClose={closeForm}
        onSubmit={handleSaveProfile}
        onFieldChange={handleFormFieldChange}
      />
    </div>
  );
}
