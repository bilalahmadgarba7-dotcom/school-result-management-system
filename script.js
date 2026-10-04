console.log("ClassMark script loaded");
/* =========================================================
   CLASSMARK — SUPABASE CONFIGURATION
   ========================================================= */
const SUPABASE_URL =
    "https://wzqcjbuotsipshjgrboo.supabase.co";
const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m";
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY
    );
/* =========================================================
   GLOBAL STATE
   ========================================================= */
let currentUser = null;
let teacherProfile = null;
/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    initializeClassMark();
});
async function initializeClassMark() {
    setupModalEvents();
    await checkAuthSession();
}
/* =========================================================
   LOGIN MODAL
   ========================================================= */
function showLogin() {
    const modal = document.getElementById("loginModal");
    if (!modal) {
        console.error("Login modal not found.");
        return;
    }
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => {
        const usernameInput = document.getElementById("username");
        if (usernameInput) {
            usernameInput.focus();
        }
    }, 100);
}
function closeLogin() {
    const modal = document.getElementById("loginModal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}
function setupModalEvents() {
    const modal = document.getElementById("loginModal");
    if (!modal) return;
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeLogin();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLogin();
        }
    });
}
/* =========================================================
   LEARN MORE
   ========================================================= */
function learnMore() {
    const featuresSection =
        document.getElementById("features");
    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}
/* =========================================================
   AUTH SESSION
   ========================================================= */
async function checkAuthSession() {
    try {
        const {
            data,
            error
        } = await supabaseClient.auth.getSession();
        if (error) {
            console.error(
                "Session error:",
                error.message
            );
            return;
        }
        if (data && data.session) {
            currentUser = data.session.user;
            await loadTeacherProfile(currentUser);
            showTeacherDashboard(currentUser);
        }
    } catch (error) {
        console.error(
            "Authentication check failed:",
            error
        );
    }
}
/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */
supabaseClient.auth.onAuthStateChange(
    async (event, session) => {
        console.log(
            "Auth event:",
            event
        );
        if (session && session.user) {
            currentUser = session.user;
            await loadTeacherProfile(currentUser);
            showTeacherDashboard(currentUser);
        } else {
            currentUser = null;
            teacherProfile = null;
            showLandingPage();
        }
    }
);
/* =========================================================
   TEACHER LOGIN
   ========================================================= */
async function login(event) {
    event.preventDefault();
    const emailInput =
        document.getElementById("username");
    const passwordInput =
        document.getElementById("password");
    const submitButton =
        document.querySelector(
            "#loginForm button[type='submit']"
        );
    if (!emailInput || !passwordInput) {
        alert(
            "Login form could not be loaded."
        );
        return;
    }
    const email =
        emailInput.value.trim();
    const password =
        passwordInput.value;
    if (!email || !password) {
        alert(
            "Please enter your email and password."
        );
        return;
    }
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent =
            "Signing In...";
    }
    try {
        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) {
            throw error;
        }
        if (!data || !data.user) {
            throw new Error(
                "Login was not completed."
            );
        }
        currentUser = data.user;
        await loadTeacherProfile(currentUser);
        closeLogin();
        showTeacherDashboard(currentUser);
    } catch (error) {
        console.error(
            "Login error:",
            error
        );
        alert(
            getLoginErrorMessage(error)
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                "Sign In to ClassMark";
        }
    }
}
/* =========================================================
   LOGIN ERROR MESSAGES
   ========================================================= */
function getLoginErrorMessage(error) {
    const message =
        error?.message?.toLowerCase() || "";
    if (
        message.includes(
            "invalid login credentials"
        )
    ) {
        return (
            "Invalid email or password. " +
            "Please check your details and try again."
        );
    }
    if (
        message.includes(
            "email not confirmed"
        )
    ) {
        return (
            "Your email address has not been confirmed yet."
        );
    }
    if (
        message.includes(
            "too many requests"
        )
    ) {
        return (
            "Too many login attempts. " +
            "Please wait a moment and try again."
        );
    }
    return (
        error?.message ||
        "Unable to sign in. Please try again."
    );
}
/* =========================================================
   LOAD TEACHER PROFILE
   ========================================================= */
async function loadTeacherProfile(user) {
    if (!user || !user.id) {
        console.error(
            "No authenticated user available."
        );
        return null;
    }
    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("Teacher")
            .select(
                "id, full_name, phone, username, email, school_name, class_name, session, term"
            )
            .eq("id", user.id)
            .single();
        if (error) {
            console.error(
                "Teacher profile error:",
                error
            );
            teacherProfile = null;
            return null;
        }
        teacherProfile = data;
        console.log(
            "Teacher profile loaded:",
            teacherProfile
        );
        return teacherProfile;
    } catch (error) {
        console.error(
            "Unable to load teacher profile:",
            error
        );
        teacherProfile = null;
        return null;
    }
}
/* =========================================================
   LOGOUT
   ========================================================= */
async function logout() {
    try {
        const {
            error
        } = await supabaseClient.auth.signOut();
        if (error) {
            throw error;
        }
        currentUser = null;
        teacherProfile = null;
        showLandingPage();
    } catch (error) {
        console.error(
            "Logout error:",
            error
        );
        alert(
            "Unable to sign out. Please try again."
        );
    }
}
/* =========================================================
   TEACHER DASHBOARD
   ========================================================= */
function showTeacherDashboard(user) {
    hideLandingPage();
    let dashboard =
        document.getElementById(
            "teacherDashboard"
        );
    if (!dashboard) {
        dashboard =
            document.createElement("div");
        dashboard.id =
            "teacherDashboard";
        document.body.appendChild(
            dashboard
        );
    }
    const profile =
        teacherProfile || {};
    const displayName =
        profile.full_name ||
        getUserDisplayName(user);
    const schoolName =
        profile.school_name ||
        "School not configured";
    const className =
        profile.class_name ||
        "Class not configured";
    const session =
        profile.session ||
        "Session not configured";
    const term =
        profile.term ||
        "Term not configured";
    dashboard.innerHTML = `
        <div class="dashboard-shell">
            <header class="dashboard-topbar">
                <div class="dashboard-brand">
                    <div class="dashboard-brand-icon">
                        CM
                    </div>
                    <div>
                        <strong>ClassMark</strong>
                        <span>Teacher Dashboard</span>
                    </div>
                </div>
                <div class="dashboard-user">
                    <div class="dashboard-user-info">
                        <strong>
                            ${escapeHTML(displayName)}
                        </strong>
                        <span>
                            ${escapeHTML(
                                profile.email ||
                                user?.email ||
                                ""
                            )}
                        </span>
                    </div>
                    <button
                        type="button"
                        class="dashboard-logout"
                        onclick="logout()"
                    >
                        Logout
                    </button>
                </div>
            </header>
            <div class="dashboard-layout">
                <aside class="dashboard-sidebar">
                    <div class="sidebar-profile">
                        <div class="profile-avatar">
                            ${escapeHTML(
                                getInitials(displayName)
                            )}
                        </div>
                        <strong>
                            ${escapeHTML(displayName)}
                        </strong>
                        <span>
                            ${escapeHTML(className)}
                        </span>
                    </div>
                    <nav class="dashboard-nav">
                        <button
                            type="button"
                            class="dashboard-nav-item active"
                            onclick="showDashboardSection('overview', this)"
                        >
                            <span>⌂</span>
                            Overview
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('students', this)"
                        >
                            <span>👨‍🎓</span>
                            Students
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('subjects', this)"
                        >
                            <span>📚</span>
                            Subjects
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('marks', this)"
                        >
                            <span>📝</span>
                            Enter Marks
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('ocr', this)"
                        >
                            <span>📷</span>
                            Score Sheet OCR
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('attendance', this)"
                        >
                            <span>📅</span>
                            Attendance
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('results', this)"
                        >
                            <span>📊</span>
                            Generate Results
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('reports', this)"
                        >
                            <span>📄</span>
                            Reports
                        </button>
                        <button
                            type="button"
                            class="dashboard-nav-item"
                            onclick="showDashboardSection('settings', this)"
                        >
                            <span>⚙️</span>
                            Settings
                        </button>
                    </nav>
                </aside>
                <main class="dashboard-main">
                    <section
                        class="dashboard-section active"
                        data-section="overview"
                    >
                        <div class="dashboard-welcome">
                            <div>
                                <span class="dashboard-eyebrow">
                                    TEACHER WORKSPACE
                                </span>
                                <h1>
                                    Welcome,
                                    ${escapeHTML(displayName)}
                                </h1>
                                <p>
                                    Manage your classroom,
                                    academic records and results
                                    from one place.
                                </p>
                            </div>
                        </div>
                        <div class="teacher-profile-card">
                            <div class="profile-card-header">
                                <div>
                                    <span class="dashboard-eyebrow">
                                        TEACHER PROFILE
                                    </span>
                                    <h2>
                                        Class Information
                                    </h2>
                                </div>
                                <div class="profile-status">
                                    ✓ Authenticated
                                </div>
                            </div>
                            <div class="profile-details-grid">
                                ${profileDetail(
                                    "Full Name",
                                    displayName
                                )}
                                ${profileDetail(
                                    "Phone Number",
                                    profile.phone ||
                                    "Not provided"
                                )}
                                ${profileDetail(
                                    "Username",
                                    profile.username ||
                                    "Not provided"
                                )}
                                ${profileDetail(
                                    "Email",
                                    profile.email ||
                                    user?.email ||
                                    "Not provided"
                                )}
                                ${profileDetail(
                                    "School",
                                    schoolName
                                )}
                                ${profileDetail(
                                    "Class",
                                    className
                                )}
                                ${profileDetail(
                                    "Session",
                                    session
                                )}
                                ${profileDetail(
                                    "Term",
                                    term
                                )}
                            </div>
                        </div>
                        <div class="dashboard-stats">
                            <div class="dashboard-stat-card">
                                <span>Students</span>
                                <strong>0</strong>
                                <small>
                                    No students added yet
                                </small>
                            </div>
                            <div class="dashboard-stat-card">
                                <span>Subjects</span>
                                <strong>0</strong>
                                <small>
                                    No subjects configured
                                </small>
                            </div>
                            <div class="dashboard-stat-card">
                                <span>Results</span>
                                <strong>0%</strong>
                                <small>
                                    Result completion
                                </small>
                            </div>
                            <div class="dashboard-stat-card">
                                <span>Attendance</span>
                                <strong>0%</strong>
                                <small>
                                    Attendance recorded
                                </small>
                            </div>
                        </div>
                        <div class="quick-actions">
                            <h2>
                                Quick Actions
                            </h2>
                            <div class="quick-action-grid">
                                <button
                                    type="button"
                                    onclick="showDashboardSection('students')"
                                >
                                    <span>👨‍🎓</span>
                                    <strong>
                                        Add Students
                                    </strong>
                                    <small>
                                        Manage your class list
                                    </small>
                                </button>
                                <button
                                    type="button"
                                    onclick="showDashboardSection('subjects')"
                                >
                                    <span>📚</span>
                                    <strong>
                                        Manage Subjects
                                    </strong>
                                    <small>
                                        Configure class subjects
                                    </small>
                                </button>
                                <button
                                    type="button"
                                    onclick="showDashboardSection('marks')"
                                >
                                    <span>📝</span>
                                    <strong>
                                        Enter Marks
                                    </strong>
                                    <small>
                                        Record CA and exam scores
                                    </small>
                                </button>
                                <button
                                    type="button"
                                    onclick="showDashboardSection('attendance')"
                                >
                                    <span>📅</span>
                                    <strong>
                                        Attendance
                                    </strong>
                                    <small>
                                        Track student attendance
                                    </small>
                                </button>
                            </div>
                        </div>
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="students"
                    >
                        ${comingSoonSection(
                            "Student Management",
                            "Add, edit, organize and manage your students."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="subjects"
                    >
                        ${comingSoonSection(
                            "Subject Management",
                            "Configure the subjects used by your class."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="marks"
                    >
                        ${comingSoonSection(
                            "Marks & Assessments",
                            "Record CA1, CA2, CA3 and examination scores."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="ocr"
                    >
                        ${comingSoonSection(
                            "Score Sheet OCR",
                            "Upload score sheets and extract marks automatically."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="attendance"
                    >
                        ${comingSoonSection(
                            "Attendance",
                            "Track present days, absent days and attendance percentage."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="results"
                    >
                        ${comingSoonSection(
                            "Result Generation",
                            "Calculate totals, averages, grades and positions."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="reports"
                    >
                        ${comingSoonSection(
                            "Professional Reports",
                            "Generate student and class academic reports."
                        )}
                    </section>
                    <section
                        class="dashboard-section"
                        data-section="settings"
                    >
                        ${comingSoonSection(
                            "Settings",
                            "Manage your ClassMark teacher account and class configuration."
                        )}
                    </section>
                </main>
            </div>
        </div>
    `;
    addDashboardStyles();
}
/* =========================================================
   DASHBOARD NAVIGATION
   ========================================================= */
function showDashboardSection(
    sectionName,
    clickedButton = null
) {
    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );
    sections.forEach((section) => {
        section.classList.remove(
            "active"
        );
        if (
            section.dataset.section ===
            sectionName
        ) {
            section.classList.add(
                "active"
            );
        }
    });
    const navButtons =
        document.querySelectorAll(
            ".dashboard-nav-item"
        );
    navButtons.forEach((button) => {
        button.classList.remove(
            "active"
        );
    });
    if (clickedButton) {
        clickedButton.classList.add(
            "active"
        );
    } else {
        navButtons.forEach((button) => {
            const text =
                button.textContent
                    .trim()
                    .toLowerCase();
            if (
                text.includes(
                    sectionName.toLowerCase()
                )
            ) {
                button.classList.add(
                    "active"
                );
            }
        });
    }
}
/* =========================================================
   LANDING PAGE
   ========================================================= */
function hideLandingPage() {
    const header =
        document.querySelector(".header");
    const main =
        document.querySelector("main");
    const footer =
        document.querySelector("footer");
    if (header) {
        header.style.display = "none";
    }
    if (main) {
        main.style.display = "none";
    }
    if (footer) {
        footer.style.display = "none";
    }
}
function showLandingPage() {
    const header =
        document.querySelector(".header");
    const main =
        document.querySelector("main");
    const footer =
        document.querySelector("footer");
    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );
    if (header) {
        header.style.display = "";
    }
    if (main) {
        main.style.display = "";
    }
    if (footer) {
        footer.style.display = "";
    }
    if (dashboard) {
        dashboard.remove();
    }
}
/* =========================================================
   PROFILE HELPERS
   ========================================================= */
function profileDetail(
    label,
    value
) {
    return `
        <div class="profile-detail">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(value)}</strong>
        </div>
    `;
}
function getInitials(name) {
    if (!name) {
        return "CM";
    }
    const words =
        name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }
    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
}
function getUserDisplayName(user) {
    if (!user) {
        return "Teacher";
    }
    const metadata =
        user.user_metadata || {};
    return (
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "Teacher"
    );
}
/* =========================================================
   COMING SOON SECTION
   ========================================================= */
function comingSoonSection(
    title,
    description
) {
    return `
        <div class="coming-soon-card">
            <div class="coming-soon-icon">
                CM
            </div>
            <span class="dashboard-eyebrow">
                CLASSMARK MODULE
            </span>
            <h2>
                ${escapeHTML(title)}
            </h2>
            <p>
                ${escapeHTML(description)}
            </p>
            <span class="coming-soon-status">
                Module prepared — database connection coming next
            </span>
        </div>
    `;
}
/* =========================================================
   SECURITY — ESCAPE HTML
   ========================================================= */
function escapeHTML(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/* =========================================================
   DASHBOARD STYLES
   ========================================================= */
function addDashboardStyles() {
    if (
        document.getElementById(
            "classmarkDashboardStyles"
        )
    ) {
        return;
    }
    const style =
        document.createElement("style");
    style.id =
        "classmarkDashboardStyles";
    style.textContent = `
        #teacherDashboard {
            min-height: 100vh;
            background: #f4f7fb;
            color: #111827;
            font-family: Arial, sans-serif;
        }
        .dashboard-shell {
            min-height: 100vh;
        }
        .dashboard-topbar {
            height: 76px;
            background: #0b1220;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            gap: 20px;
        }
        .dashboard-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .dashboard-brand-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: grid;
            place-items: center;
            background: #d4af37;
            color: #0b1220;
            font-weight: 800;
        }
        .dashboard-brand strong {
            display: block;
            font-size: 18px;
        }
        .dashboard-brand span {
            display: block;
            font-size: 12px;
            opacity: .65;
            margin-top: 2px;
        }
        .dashboard-user {
            display: flex;
            align-items: center;
            gap: 18px;
        }
        .dashboard-user-info {
            text-align: right;
        }
        .dashboard-user-info strong {
            display: block;
            font-size: 14px;
        }
        .dashboard-user-info span {
            display: block;
            font-size: 12px;
            opacity: .65;
            margin-top: 3px;
        }
        .dashboard-logout {
            border: 1px solid rgba(255,255,255,.25);
            background: transparent;
            color: white;
            padding: 9px 14px;
            border-radius: 8px;
            cursor: pointer;
        }
        .dashboard-logout:hover {
            background: rgba(255,255,255,.08);
        }
        .dashboard-layout {
            min-height: calc(100vh - 76px);
            display: flex;
        }
        .dashboard-sidebar {
            width: 250px;
            flex-shrink: 0;
            background: #ffffff;
            border-right: 1px solid #e5e7eb;
            padding: 24px 14px;
        }
        .sidebar-profile {
            text-align: center;
            padding: 8px 10px 24px;
            border-bottom: 1px solid #edf0f4;
            margin-bottom: 16px;
        }
        .profile-avatar {
            width: 58px;
            height: 58px;
            margin: 0 auto 10px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #0b1220;
            color: #d4af37;
            font-weight: 800;
            font-size: 18px;
        }
        .sidebar-profile strong {
            display: block;
            font-size: 14px;
        }
        .sidebar-profile span {
            display: block;
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }
        .dashboard-nav {
            display: grid;
            gap: 5px;
        }
        .dashboard-nav-item {
            width: 100%;
            border: 0;
            background: transparent;
            color: #4b5563;
            text-align: left;
            padding: 11px 12px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
        }
        .dashboard-nav-item span {
            width: 22px;
            text-align: center;
        }
        .dashboard-nav-item:hover {
            background: #f3f6fa;
            color: #0b1220;
        }
        .dashboard-nav-item.active {
            background: #0b1220;
            color: #ffffff;
        }
        .dashboard-main {
            flex: 1;
            padding: 34px;
            min-width: 0;
        }
        .dashboard-section {
            display: none;
        }
        .dashboard-section.active {
            display: block;
        }
        .dashboard-welcome {
            margin-bottom: 28px;
        }
        .dashboard-eyebrow {
            display: inline-block;
            color: #9a7b18;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.2px;
        }
        .dashboard-welcome h1 {
            margin: 7px 0 8px;
            font-size: 32px;
            line-height: 1.15;
        }
        .dashboard-welcome p {
            margin: 0;
            color: #6b7280;
            max-width: 680px;
            line-height: 1.6;
        }
        .teacher-profile-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 8px 24px rgba(15,23,42,.05);
        }
        .profile-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 20px;
        }
        .profile-card-header h2 {
            margin: 6px 0 0;
            font-size: 20px;
        }
        .profile-status {
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
            border-radius: 999px;
            padding: 7px 11px;
            font-size: 11px;
            font-weight: 700;
        }
        .profile-details-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
        }
        .profile-detail {
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 10px;
            padding: 13px;
        }
        .profile-detail span {
            display: block;
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 5px;
        }
        .profile-detail strong {
            display: block;
            font-size: 13px;
            overflow-wrap: anywhere;
        }
        .dashboard-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 30px;
        }
        .dashboard-stat-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 20px;
        }
        .dashboard-stat-card span {
            display: block;
            color: #6b7280;
            font-size: 12px;
        }
        .dashboard-stat-card strong {
            display: block;
            font-size: 28px;
            margin: 8px 0 4px;
            color: #0b1220;
        }
        .dashboard-stat-card small {
            color: #9ca3af;
            font-size: 11px;
        }
        .quick-actions h2 {
            font-size: 20px;
            margin: 0 0 14px;
        }
        .quick-action-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
        }
        .quick-action-grid button {
            border: 1px solid #e5e7eb;
            background: #ffffff;
            border-radius: 14px;
            padding: 20px;
            text-align: left;
            cursor: pointer;
            transition: .2s ease;
        }
        .quick-action-grid button:hover {
            transform: translateY(-2px);
            border-color: #d4af37;
            box-shadow: 0 8px 20px rgba(15,23,42,.07);
        }
        .quick-action-grid span {
            display: block;
            font-size: 25px;
            margin-bottom: 12px;
        }
        .quick-action-grid strong {
            display: block;
            font-size: 14px;
            color: #111827;
        }
        .quick-action-grid small {
            display: block;
            color: #6b7280;
            margin-top: 5px;
            line-height: 1.4;
        }
        .coming-soon-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 50px 30px;
            text-align: center;
            max-width: 720px;
            margin: 40px auto;
            box-shadow: 0 8px 24px rgba(15,23,42,.05);
        }
        .coming-soon-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 18px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: #0b1220;
            color: #d4af37;
            font-weight: 800;
        }
        .coming-soon-card h2 {
            margin: 8px 0;
            font-size: 25px;
        }
        .coming-soon-card p {
            color: #6b7280;
            line-height: 1.6;
            max-width: 560px;
            margin: 0 auto 20px;
        }
        .coming-soon-status {
            display: inline-block;
            color: #9a7b18;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 999px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 700;
        }
        @media (max-width: 1050px) {
            .profile-details-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .dashboard-stats {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .quick-action-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }
        @media (max-width: 800px) {
            .dashboard-topbar {
                height: auto;
                padding: 16px 20px;
                align-items: flex-start;
            }
            .dashboard-user-info {
                display: none;
            }
            .dashboard-layout {
                display: block;
            }
            .dashboard-sidebar {
                width: 100%;
                border-right: 0;
                border-bottom: 1px solid #e5e7eb;
                padding: 14px;
            }
            .sidebar-profile {
                display: none;
            }
            .dashboard-nav {
                display: flex;
                overflow-x: auto;
                padding-bottom: 2px;
            }
            .dashboard-nav-item {
                width: auto;
                flex-shrink: 0;
                white-space: nowrap;
            }
            .dashboard-main {
                padding: 22px 16px;
            }
            .dashboard-welcome h1 {
                font-size: 27px;
            }
        }
        @media (max-width: 560px) {
            .dashboard-topbar {
                padding: 14px 15px;
            }
            .dashboard-brand-icon {
                width: 38px;
                height: 38px;
            }
            .dashboard-brand strong {
                font-size: 16px;
            }
            .dashboard-main {
                padding: 20px 13px;
            }
            .profile-details-grid,
            .dashboard-stats,
            .quick-action-grid {
                grid-template-columns: 1fr;
            }
            .teacher-profile-card {
                padding: 18px;
            }
            .profile-card-header {
                display: block;
            }
            .profile-status {
                display: inline-block;
                margin-top: 12px;
            }
        }
    `;
    document.head.appendChild(style);
}