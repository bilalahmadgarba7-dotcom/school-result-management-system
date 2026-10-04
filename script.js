console.log("ClassMark script loaded");
// ============================================================
// CLASSMARK
// Teacher Result Management System
// ============================================================
// ============================================================
// SUPABASE CONNECTION
// ============================================================
const SUPABASE_URL =
    "https://wzqcjbuotsipshjgrboo.supabase.co";
const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m";
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY
    );
// ============================================================
// APPLICATION STATE
// ============================================================
let currentUser = null;
// ============================================================
// DOM READY
// ============================================================
document.addEventListener(
    "DOMContentLoaded",
    async function () {
        console.log(
            "ClassMark application initialized."
        );
        setupModalEvents();
        await checkAuthSession();
    }
);
// ============================================================
// SHOW LOGIN MODAL
// ============================================================
function showLogin() {
    const modal =
        document.getElementById("loginModal");
    if (!modal) {
        console.error(
            "Login modal not found."
        );
        return;
    }
    modal.classList.add("active");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );
    const emailInput =
        document.getElementById("username");
    if (emailInput) {
        setTimeout(
            function () {
                emailInput.focus();
            },
            100
        );
    }
}
// ============================================================
// CLOSE LOGIN MODAL
// ============================================================
function closeLogin() {
    const modal =
        document.getElementById("loginModal");
    if (!modal) {
        return;
    }
    modal.classList.remove("active");
    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}
// ============================================================
// MODAL EVENTS
// ============================================================
function setupModalEvents() {
    document.addEventListener(
        "click",
        function (event) {
            const modal =
                document.getElementById(
                    "loginModal"
                );
            if (
                modal &&
                event.target === modal
            ) {
                closeLogin();
            }
        }
    );
    document.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key === "Escape"
            ) {
                const modal =
                    document.getElementById(
                        "loginModal"
                    );
                if (
                    modal &&
                    modal.classList.contains(
                        "active"
                    )
                ) {
                    closeLogin();
                }
            }
        }
    );
}
// ============================================================
// LEARN MORE
// ============================================================
function learnMore() {
    const featuresSection =
        document.getElementById(
            "features"
        );
    if (!featuresSection) {
        return;
    }
    featuresSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
// ============================================================
// CHECK AUTH SESSION
// ============================================================
async function checkAuthSession() {
    try {
        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();
        if (error) {
            console.error(
                "Session error:",
                error
            );
            return;
        }
        if (
            data &&
            data.session &&
            data.session.user
        ) {
            currentUser =
                data.session.user;
            console.log(
                "Existing session found:",
                currentUser.email
            );
        }
    } catch (error) {
        console.error(
            "Unable to check session:",
            error
        );
    }
}
// ============================================================
// AUTH STATE LISTENER
// ============================================================
supabaseClient.auth.onAuthStateChange(
    function (
        event,
        session
    ) {
        console.log(
            "Auth state changed:",
            event
        );
        if (
            session &&
            session.user
        ) {
            currentUser =
                session.user;
        } else {
            currentUser = null;
        }
    }
);
// ============================================================
// TEACHER LOGIN
// ============================================================
async function login(event) {
    event.preventDefault();
    const emailInput =
        document.getElementById(
            "username"
        );
    const passwordInput =
        document.getElementById(
            "password"
        );
    if (
        !emailInput ||
        !passwordInput
    ) {
        alert(
            "Login form could not be loaded."
        );
        return;
    }
    const email =
        emailInput.value
            .trim();
    const password =
        passwordInput.value
            .trim();
    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------
    if (!email || !password) {
        alert(
            "Please enter your email and password."
        );
        return;
    }
    const submitButton =
        document.querySelector(
            "#loginForm button[type='submit']"
        );
    if (submitButton) {
        submitButton.disabled =
            true;
        submitButton.textContent =
            "Signing In...";
    }
    try {
        // ----------------------------------------------------
        // SUPABASE AUTHENTICATION
        // ----------------------------------------------------
        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email: email,
                    password: password
                });
        // ----------------------------------------------------
        // AUTH ERROR
        // ----------------------------------------------------
        if (error) {
            console.error(
                "Authentication error:",
                error
            );
            alert(
                getLoginErrorMessage(
                    error
                )
            );
            return;
        }
        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------
        currentUser =
            data.user;
        console.log(
            "Logged in user:",
            currentUser
        );
        closeLogin();
        showTeacherDashboard(
            currentUser
        );
    } catch (error) {
        console.error(
            "Unexpected login error:",
            error
        );
        alert(
            "Something went wrong while logging in. Please try again."
        );
    } finally {
        if (submitButton) {
            submitButton.disabled =
                false;
            submitButton.textContent =
                "Sign In to ClassMark";
        }
    }
}
// ============================================================
// LOGIN ERROR MESSAGES
// ============================================================
function getLoginErrorMessage(
    error
) {
    if (!error) {
        return (
            "Unable to sign in."
        );
    }
    const message =
        String(
            error.message || ""
        ).toLowerCase();
    if (
        message.includes(
            "invalid login credentials"
        )
    ) {
        return (
            "Invalid email or password."
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
            "Too many login attempts. Please wait a moment and try again."
        );
    }
    return (
        error.message ||
        "Unable to sign in. Please try again."
    );
}
// ============================================================
// LOGOUT
// ============================================================
async function logout() {
    try {
        const {
            error
        } =
            await supabaseClient.auth
                .signOut();
        if (error) {
            console.error(
                "Logout error:",
                error
            );
            alert(
                "Unable to log out. Please try again."
            );
            return;
        }
        currentUser = null;
        showLandingPage();
    } catch (error) {
        console.error(
            "Unexpected logout error:",
            error
        );
        alert(
            "Something went wrong while logging out."
        );
    }
}
// ============================================================
// SHOW TEACHER DASHBOARD
// ============================================================
function showTeacherDashboard(
    user
) {
    const existingDashboard =
        document.getElementById(
            "teacherDashboard"
        );
    if (existingDashboard) {
        existingDashboard.style.display =
            "block";
        document.body.classList.add(
            "dashboard-active"
        );
        return;
    }
    const dashboard =
        document.createElement(
            "div"
        );
    dashboard.id =
        "teacherDashboard";
    dashboard.className =
        "teacher-dashboard";
    dashboard.innerHTML = `
        <div class="dashboard-shell">
            <!-- ==========================================
                 DASHBOARD HEADER
            =========================================== -->
            <header class="dashboard-header">
                <div class="dashboard-brand">
                    <div class="dashboard-logo">
                        CM
                    </div>
                    <div>
                        <strong>
                            ClassMark
                        </strong>
                        <span>
                            Teacher Dashboard
                        </span>
                    </div>
                </div>
                <div class="dashboard-user">
                    <div class="dashboard-user-info">
                        <strong>
                            ${escapeHTML(
                                getUserDisplayName(
                                    user
                                )
                            )}
                        </strong>
                        <span>
                            ${escapeHTML(
                                user.email ||
                                "Teacher Account"
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
            <!-- ==========================================
                 DASHBOARD BODY
            =========================================== -->
            <div class="dashboard-body">
                <!-- ======================================
                     SIDEBAR
                ======================================= -->
                <aside class="dashboard-sidebar">
                    <nav
                        class="dashboard-menu"
                        aria-label="Teacher dashboard navigation"
                    >
                        <button
                            type="button"
                            class="dashboard-menu-item active"
                            onclick="openDashboardSection('overview', this)"
                        >
                            <span>📊</span>
                            <span>Dashboard</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('students', this)"
                        >
                            <span>👨‍🎓</span>
                            <span>Students</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('subjects', this)"
                        >
                            <span>📚</span>
                            <span>Subjects</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('marks', this)"
                        >
                            <span>📝</span>
                            <span>Enter Marks</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('ocr', this)"
                        >
                            <span>📷</span>
                            <span>Score Sheet</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('attendance', this)"
                        >
                            <span>📅</span>
                            <span>Attendance</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('results', this)"
                        >
                            <span>📈</span>
                            <span>Generate Results</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('reports', this)"
                        >
                            <span>📄</span>
                            <span>Reports</span>
                        </button>
                        <button
                            type="button"
                            class="dashboard-menu-item"
                            onclick="openDashboardSection('settings', this)"
                        >
                            <span>⚙️</span>
                            <span>Settings</span>
                        </button>
                    </nav>
                </aside>
                <!-- ======================================
                     MAIN DASHBOARD CONTENT
                ======================================= -->
                <main class="dashboard-main">
                    <!-- OVERVIEW -->
                    <section
                        id="dashboard-section-overview"
                        class="dashboard-section active"
                    >
                        <div class="dashboard-page-heading">
                            <div>
                                <span>
                                    TEACHER WORKSPACE
                                </span>
                                <h1>
                                    Welcome to ClassMark
                                </h1>
                                <p>
                                    Manage your class, marks,
                                    attendance and academic results
                                    from one place.
                                </p>
                            </div>
                        </div>
                        <!-- STAT CARDS -->
                        <div class="dashboard-stat-grid">
                            <div class="dashboard-stat-card">
                                <div class="dashboard-stat-icon">
                                    👨‍🎓
                                </div>
                                <div>
                                    <strong>
                                        0
                                    </strong>
                                    <span>
                                        Students
                                    </span>
                                </div>
                            </div>
                            <div class="dashboard-stat-card">
                                <div class="dashboard-stat-icon">
                                    📚
                                </div>
                                <div>
                                    <strong>
                                        0
                                    </strong>
                                    <span>
                                        Subjects
                                    </span>
                                </div>
                            </div>
                            <div class="dashboard-stat-card">
                                <div class="dashboard-stat-icon">
                                    📝
                                </div>
                                <div>
                                    <strong>
                                        0%
                                    </strong>
                                    <span>
                                        Result Completion
                                    </span>
                                </div>
                            </div>
                            <div class="dashboard-stat-card">
                                <div class="dashboard-stat-icon">
                                    📅
                                </div>
                                <div>
                                    <strong>
                                        0%
                                    </strong>
                                    <span>
                                        Attendance
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- QUICK ACTIONS -->
                        <div class="dashboard-panel">
                            <div class="dashboard-panel-header">
                                <div>
                                    <h2>
                                        Quick Actions
                                    </h2>
                                    <p>
                                        Start managing your classroom.
                                    </p>
                                </div>
                            </div>
                            <div class="dashboard-action-grid">
                                <button
                                    type="button"
                                    onclick="openDashboardSectionByName('students')"
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
                                    onclick="openDashboardSectionByName('subjects')"
                                >
                                    <span>📚</span>
                                    <strong>
                                        Add Subjects
                                    </strong>
                                    <small>
                                        Configure class subjects
                                    </small>
                                </button>
                                <button
                                    type="button"
                                    onclick="openDashboardSectionByName('marks')"
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
                                    onclick="openDashboardSectionByName('attendance')"
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
                        <!-- CLASS INFORMATION -->
                        <div class="dashboard-panel">
                            <div class="dashboard-panel-header">
                                <div>
                                    <h2>
                                        Class Information
                                    </h2>
                                    <p>
                                        Your current teaching profile.
                                    </p>
                                </div>
                            </div>
                            <div class="dashboard-info-grid">
                                <div>
                                    <span>
                                        Teacher
                                    </span>
                                    <strong>
                                        ${escapeHTML(
                                            getUserDisplayName(
                                                user
                                            )
                                        )}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        Email
                                    </span>
                                    <strong>
                                        ${escapeHTML(
                                            user.email ||
                                            "Not available"
                                        )}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        School
                                    </span>
                                    <strong>
                                        Not configured
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        Class
                                    </span>
                                    <strong>
                                        Not configured
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </section>
                    <!-- STUDENTS -->
                    <section
                        id="dashboard-section-students"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                CLASS MANAGEMENT
                            </span>
                            <h1>
                                Students
                            </h1>
                            <p>
                                Add, organize and manage students
                                in your classroom.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    👨‍🎓
                                </div>
                                <h2>
                                    No Students Yet
                                </h2>
                                <p>
                                    Student management will be connected
                                    to your ClassMark database here.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Student Management')"
                                >
                                    Add Student
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- SUBJECTS -->
                    <section
                        id="dashboard-section-subjects"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                ACADEMIC SETUP
                            </span>
                            <h1>
                                Subjects
                            </h1>
                            <p>
                                Configure the subjects taught in your class.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    📚
                                </div>
                                <h2>
                                    No Subjects Configured
                                </h2>
                                <p>
                                    Your class subjects will appear here
                                    once they are connected to Supabase.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Subject Management')"
                                >
                                    Add Subject
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- MARKS -->
                    <section
                        id="dashboard-section-marks"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                ASSESSMENTS
                            </span>
                            <h1>
                                Enter Marks
                            </h1>
                            <p>
                                Record CA and examination scores
                                for your students.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    📝
                                </div>
                                <h2>
                                    Marks Entry
                                </h2>
                                <p>
                                    Marks entry will be connected to
                                    students and subjects in the next
                                    database stage.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Marks Entry')"
                                >
                                    Open Marks Entry
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- OCR -->
                    <section
                        id="dashboard-section-ocr"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                SMART DATA ENTRY
                            </span>
                            <h1>
                                Score Sheet Upload
                            </h1>
                            <p>
                                Upload score sheets and review extracted
                                marks using OCR technology.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    📷
                                </div>
                                <h2>
                                    OCR Score Sheet
                                </h2>
                                <p>
                                    OCR processing will be added after
                                    the core student and marks database
                                    is ready.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Score Sheet OCR')"
                                >
                                    Upload Score Sheet
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- ATTENDANCE -->
                    <section
                        id="dashboard-section-attendance"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                CLASS MONITORING
                            </span>
                            <h1>
                                Attendance
                            </h1>
                            <p>
                                Track present days, absent days and
                                attendance percentages.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    📅
                                </div>
                                <h2>
                                    Attendance Tracking
                                </h2>
                                <p>
                                    Attendance records will be connected
                                    to your students in the database stage.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Attendance Tracking')"
                                >
                                    Open Attendance
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- RESULTS -->
                    <section
                        id="dashboard-section-results"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                ACADEMIC PERFORMANCE
                            </span>
                            <h1>
                                Generate Results
                            </h1>
                            <p>
                                Calculate totals, averages, grades,
                                remarks and positions.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    📈
                                </div>
                                <h2>
                                    Result Generation
                                </h2>
                                <p>
                                    Automatic result calculations will
                                    be enabled after marks data is connected.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Result Generation')"
                                >
                                    Generate Results
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- REPORTS -->
                    <section
                        id="dashboard-section-reports"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                DOCUMENTS
                            </span>
                            <h1>
                                Reports
                            </h1>
                            <p>
                                Generate professional student and class reports.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="empty-dashboard-state">
                                <div>
                                    📄
                                </div>
                                <h2>
                                    Professional Reports
                                </h2>
                                <p>
                                    Student report sheets and printable
                                    result documents will be available here.
                                </p>
                                <button
                                    type="button"
                                    class="dashboard-primary-button"
                                    onclick="showComingSoon('Reports')"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </section>
                    <!-- SETTINGS -->
                    <section
                        id="dashboard-section-settings"
                        class="dashboard-section"
                    >
                        <div class="dashboard-page-heading">
                            <span>
                                ACCOUNT
                            </span>
                            <h1>
                                Settings
                            </h1>
                            <p>
                                Manage your teacher and class information.
                            </p>
                        </div>
                        <div class="dashboard-panel">
                            <div class="dashboard-info-grid">
                                <div>
                                    <span>
                                        Account Email
                                    </span>
                                    <strong>
                                        ${escapeHTML(
                                            user.email ||
                                            "Not available"
                                        )}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        Account Status
                                    </span>
                                    <strong>
                                        Authenticated
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        School
                                    </span>
                                    <strong>
                                        Not configured
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        Class
                                    </span>
                                    <strong>
                                        Not configured
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    `;
    document.body.appendChild(
        dashboard
    );
    document.body.classList.add(
        "dashboard-active"
    );
    hideLandingPage();
    addDashboardStyles();
}
// ============================================================
// HIDE LANDING PAGE
// ============================================================
function hideLandingPage() {
    const header =
        document.querySelector(
            ".header"
        );
    const main =
        document.querySelector(
            "body > main"
        );
    const modal =
        document.getElementById(
            "loginModal"
        );
    const footer =
        document.querySelector(
            "body > footer"
        );
    if (header) {
        header.style.display =
            "none";
    }
    if (main) {
        main.style.display =
            "none";
    }
    if (modal) {
        modal.style.display =
            "none";
    }
    if (footer) {
        footer.style.display =
            "none";
    }
}
// ============================================================
// SHOW LANDING PAGE
// ============================================================
function showLandingPage() {
    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );
    if (dashboard) {
        dashboard.remove();
    }
    const header =
        document.querySelector(
            ".header"
        );
    const main =
        document.querySelector(
            "body > main"
        );
    const footer =
        document.querySelector(
            "body > footer"
        );
    if (header) {
        header.style.display =
            "";
    }
    if (main) {
        main.style.display =
            "";
    }
    if (footer) {
        footer.style.display =
            "";
    }
    document.body.classList.remove(
        "dashboard-active"
    );
}
// ============================================================
// OPEN DASHBOARD SECTION
// ============================================================
function openDashboardSection(
    sectionName,
    button
) {
    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );
    sections.forEach(
        function (section) {
            section.classList.remove(
                "active"
            );
        }
    );
    const target =
        document.getElementById(
            "dashboard-section-" +
            sectionName
        );
    if (target) {
        target.classList.add(
            "active"
        );
    }
    const menuItems =
        document.querySelectorAll(
            ".dashboard-menu-item"
        );
    menuItems.forEach(
        function (item) {
            item.classList.remove(
                "active"
            );
        }
    );
    if (button) {
        button.classList.add(
            "active"
        );
    }
}
// ============================================================
// OPEN DASHBOARD SECTION BY NAME
// ============================================================
function openDashboardSectionByName(
    sectionName
) {
    const targetButton =
        document.querySelector(
            `.dashboard-menu-item[onclick*="'${sectionName}'"]`
        );
    openDashboardSection(
        sectionName,
        targetButton
    );
}
// ============================================================
// COMING SOON
// ============================================================
function showComingSoon(
    featureName
) {
    alert(
        featureName +
        " is prepared in the ClassMark dashboard and will be connected to the database in the next development stage."
    );
}
// ============================================================
// USER DISPLAY NAME
// ============================================================
function getUserDisplayName(
    user
) {
    if (!user) {
        return "Teacher";
    }
    const metadata =
        user.user_metadata || {};
    return (
        metadata.full_name ||
        metadata.name ||
        metadata.username ||
        "Teacher"
    );
}
// ============================================================
// HTML ESCAPE
// ============================================================
function escapeHTML(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
// ============================================================
// DASHBOARD STYLES
// ============================================================
function addDashboardStyles() {
    if (
        document.getElementById(
            "classmark-dashboard-styles"
        )
    ) {
        return;
    }
    const style =
        document.createElement(
            "style"
        );
    style.id =
        "classmark-dashboard-styles";
    style.textContent = `
        /* ==========================================
           DASHBOARD BASE
        =========================================== */
        .teacher-dashboard {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #070b14;
            color: #f4f7fb;
            overflow: auto;
            font-family: inherit;
        }
        .dashboard-shell {
            min-height: 100vh;
        }
        /* ==========================================
           HEADER
        =========================================== */
        .dashboard-header {
            min-height: 76px;
            padding: 14px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            background: #0b1220;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .dashboard-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .dashboard-logo {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: #d6ad42;
            color: #07101d;
            font-weight: 800;
        }
        .dashboard-brand strong {
            display: block;
            font-size: 18px;
        }
        .dashboard-brand span {
            display: block;
            margin-top: 2px;
            font-size: 12px;
            color: #9aa6b8;
        }
        .dashboard-user {
            display: flex;
            align-items: center;
            gap: 16px;
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
            margin-top: 3px;
            color: #8f9bad;
            font-size: 12px;
        }
        .dashboard-logout {
            border: 1px solid rgba(214,173,66,0.45);
            background: transparent;
            color: #d6ad42;
            padding: 9px 14px;
            border-radius: 9px;
            cursor: pointer;
            font-weight: 700;
        }
        .dashboard-logout:hover {
            background: rgba(214,173,66,0.10);
        }
        /* ==========================================
           BODY
        =========================================== */
        .dashboard-body {
            min-height: calc(100vh - 76px);
            display: flex;
        }
        /* ==========================================
           SIDEBAR
        =========================================== */
        .dashboard-sidebar {
            width: 245px;
            flex-shrink: 0;
            padding: 22px 14px;
            background: #090f1b;
            border-right: 1px solid rgba(255,255,255,0.07);
        }
        .dashboard-menu {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .dashboard-menu-item {
            width: 100%;
            border: 0;
            background: transparent;
            color: #9ba7b8;
            padding: 12px 14px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 11px;
            text-align: left;
            cursor: pointer;
            font: inherit;
        }
        .dashboard-menu-item:hover {
            background: rgba(255,255,255,0.05);
            color: #ffffff;
        }
        .dashboard-menu-item.active {
            background: rgba(214,173,66,0.13);
            color: #d6ad42;
        }
        .dashboard-menu-item span:first-child {
            width: 24px;
            text-align: center;
        }
        /* ==========================================
           MAIN
        =========================================== */
        .dashboard-main {
            flex: 1;
            padding: 32px;
            overflow-x: hidden;
        }
        .dashboard-section {
            display: none;
            max-width: 1250px;
            margin: 0 auto;
        }
        .dashboard-section.active {
            display: block;
        }
        .dashboard-page-heading {
            margin-bottom: 28px;
        }
        .dashboard-page-heading > span {
            display: block;
            margin-bottom: 7px;
            color: #d6ad42;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
        }
        .dashboard-page-heading h1 {
            margin: 0;
            font-size: clamp(28px, 4vw, 42px);
            line-height: 1.1;
        }
        .dashboard-page-heading p {
            margin: 10px 0 0;
            max-width: 650px;
            color: #9ba7b8;
            line-height: 1.7;
        }
        /* ==========================================
           STATISTICS
        =========================================== */
        .dashboard-stat-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
        }
        .dashboard-stat-card {
            padding: 20px;
            border-radius: 14px;
            background: #0d1524;
            border: 1px solid rgba(255,255,255,0.07);
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .dashboard-stat-icon {
            width: 46px;
            height: 46px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(214,173,66,0.10);
            font-size: 21px;
        }
        .dashboard-stat-card strong {
            display: block;
            font-size: 25px;
        }
        .dashboard-stat-card span {
            display: block;
            margin-top: 4px;
            color: #8f9bad;
            font-size: 12px;
        }
        /* ==========================================
           PANELS
        =========================================== */
        .dashboard-panel {
            margin-bottom: 20px;
            padding: 22px;
            border-radius: 15px;
            background: #0d1524;
            border: 1px solid rgba(255,255,255,0.07);
        }
        .dashboard-panel-header {
            margin-bottom: 18px;
        }
        .dashboard-panel-header h2 {
            margin: 0;
            font-size: 19px;
        }
        .dashboard-panel-header p {
            margin: 6px 0 0;
            color: #8995a7;
            font-size: 13px;
        }
        /* ==========================================
           QUICK ACTIONS
        =========================================== */
        .dashboard-action-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
        }
        .dashboard-action-grid button {
            padding: 18px;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            background: #111b2c;
            color: #ffffff;
            text-align: left;
            cursor: pointer;
            font: inherit;
        }
        .dashboard-action-grid button:hover {
            border-color: rgba(214,173,66,0.40);
            transform: translateY(-1px);
        }
        .dashboard-action-grid button > span {
            display: block;
            margin-bottom: 12px;
            font-size: 24px;
        }
        .dashboard-action-grid strong {
            display: block;
            font-size: 14px;
        }
        .dashboard-action-grid small {
            display: block;
            margin-top: 6px;
            color: #8f9bad;
            line-height: 1.5;
        }
        /* ==========================================
           INFO GRID
        =========================================== */
        .dashboard-info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }
        .dashboard-info-grid > div {
            padding: 16px;
            border-radius: 11px;
            background: #111b2c;
            border: 1px solid rgba(255,255,255,0.06);
        }
        .dashboard-info-grid span {
            display: block;
            color: #7f8b9d;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
        }
        .dashboard-info-grid strong {
            display: block;
            margin-top: 7px;
            font-size: 14px;
            word-break: break-word;
        }
        /* ==========================================
           EMPTY STATE
        =========================================== */
        .empty-dashboard-state {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px;
        }
        .empty-dashboard-state > div {
            width: 64px;
            height: 64px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            background: rgba(214,173,66,0.10);
            font-size: 30px;
            margin-bottom: 16px;
        }
        .empty-dashboard-state h2 {
            margin: 0;
            font-size: 20px;
        }
        .empty-dashboard-state p {
            max-width: 500px;
            margin: 9px auto 18px;
            color: #8f9bad;
            line-height: 1.7;
        }
        .dashboard-primary-button {
            border: 0;
            border-radius: 9px;
            padding: 11px 17px;
            background: #d6ad42;
            color: #07101d;
            font-weight: 800;
            cursor: pointer;
        }
        .dashboard-primary-button:hover {
            filter: brightness(1.08);
        }
        /* ==========================================
           MOBILE
        =========================================== */
        @media (max-width: 900px) {
            .dashboard-stat-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .dashboard-action-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .dashboard-sidebar {
                width: 210px;
            }
        }
        @media (max-width: 680px) {
            .dashboard-header {
                padding: 12px 16px;
            }
            .dashboard-user-info {
                display: none;
            }
            .dashboard-body {
                display: block;
            }
            .dashboard-sidebar {
                width: 100%;
                padding: 10px;
                border-right: 0;
                border-bottom: 1px solid rgba(255,255,255,0.07);
            }
            .dashboard-menu {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
            }
            .dashboard-menu-item {
                justify-content: center;
                flex-direction: column;
                gap: 4px;
                padding: 9px 5px;
                font-size: 10px;
                text-align: center;
            }
            .dashboard-menu-item span:first-child {
                width: auto;
            }
            .dashboard-main {
                padding: 20px 14px;
            }
            .dashboard-stat-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            .dashboard-stat-card {
                padding: 15px;
                flex-direction: column;
                align-items: flex-start;
            }
            .dashboard-action-grid {
                grid-template-columns: 1fr;
            }
            .dashboard-info-grid {
                grid-template-columns: 1fr;
            }
        }
        @media (max-width: 420px) {
            .dashboard-stat-grid {
                grid-template-columns: 1fr;
            }
            .dashboard-logo {
                width: 38px;
                height: 38px;
            }
            .dashboard-brand strong {
                font-size: 16px;
            }
            .dashboard-logout {
                padding: 8px 11px;
                font-size: 12px;
            }
        }
    `;
    document.head.appendChild(
        style
    );
}