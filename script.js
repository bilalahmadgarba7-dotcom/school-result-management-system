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
let studentsCache = [];

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
    const modal =
        document.getElementById("loginModal");

    if (!modal) {
        console.error("Login modal not found.");
        return;
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        const usernameInput =
            document.getElementById("username");

        if (usernameInput) {
            usernameInput.focus();
        }
    }, 100);
}

function closeLogin() {
    const modal =
        document.getElementById("loginModal");

    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

function setupModalEvents() {
    const modal =
        document.getElementById("loginModal");

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

            await loadTeacherProfile(
                currentUser
            );

            showTeacherDashboard(
                currentUser
            );
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

            currentUser =
                session.user;

            await loadTeacherProfile(
                currentUser
            );

            showTeacherDashboard(
                currentUser
            );

        } else {

            currentUser = null;
            teacherProfile = null;
            studentsCache = [];

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
        } =
            await supabaseClient.auth
                .signInWithPassword({
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

        currentUser =
            data.user;

        await loadTeacherProfile(
            currentUser
        );

        closeLogin();

        showTeacherDashboard(
            currentUser
        );

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
        } =
            await supabaseClient
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

        teacherProfile =
            data;

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
        } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        currentUser = null;
        teacherProfile = null;
        studentsCache = [];

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

                    <!-- OVERVIEW -->

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

                                <span>
                                    Students
                                </span>

                                <strong id="dashboardStudentCount">
                                    0
                                </strong>

                                <small>
                                    Students in your class
                                </small>

                            </div>

                            <div class="dashboard-stat-card">

                                <span>
                                    Subjects
                                </span>

                                <strong>
                                    0
                                </strong>

                                <small>
                                    No subjects configured
                                </small>

                            </div>

                            <div class="dashboard-stat-card">

                                <span>
                                    Results
                                </span>

                                <strong>
                                    0%
                                </strong>

                                <small>
                                    Result completion
                                </small>

                            </div>

                            <div class="dashboard-stat-card">

                                <span>
                                    Attendance
                                </span>

                                <strong>
                                    0%
                                </strong>

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


                    <!-- STUDENTS -->

                    <section
                        class="dashboard-section"
                        data-section="students"
                    >

                        ${studentManagementSection()}

                    </section>


                    <!-- SUBJECTS -->

                    <section
                        class="dashboard-section"
                        data-section="subjects"
                    >

                        ${comingSoonSection(
                            "Subject Management",
                            "Configure the subjects used by your class."
                        )}

                    </section>


                    <!-- MARKS -->

                    <section
                        class="dashboard-section"
                        data-section="marks"
                    >

                        ${comingSoonSection(
                            "Marks & Assessments",
                            "Record CA1, CA2, CA3 and examination scores."
                        )}

                    </section>


                    <!-- OCR -->

                    <section
                        class="dashboard-section"
                        data-section="ocr"
                    >

                        ${comingSoonSection(
                            "Score Sheet OCR",
                            "Upload score sheets and extract marks automatically."
                        )}

                    </section>


                    <!-- ATTENDANCE -->

                    <section
                        class="dashboard-section"
                        data-section="attendance"
                    >

                        ${comingSoonSection(
                            "Attendance",
                            "Track present days, absent days and attendance percentage."
                        )}

                    </section>


                    <!-- RESULTS -->

                    <section
                        class="dashboard-section"
                        data-section="results"
                    >

                        ${comingSoonSection(
                            "Result Generation",
                            "Calculate totals, averages, grades and positions."
                        )}

                    </section>


                    <!-- REPORTS -->

                    <section
                        class="dashboard-section"
                        data-section="reports"
                    >

                        ${comingSoonSection(
                            "Professional Reports",
                            "Generate student and class academic reports."
                        )}

                    </section>


                    <!-- SETTINGS -->

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

    loadStudents();
}

/* =========================================================
   STUDENT MANAGEMENT SECTION
   ========================================================= */

function studentManagementSection() {

    const profile =
        teacherProfile || {};

    const className =
        profile.class_name || "";

    const session =
        profile.session || "";

    const term =
        profile.term || "";

    return `

        <div class="student-page">

            <div class="student-page-header">

                <div>

                    <span class="dashboard-eyebrow">
                        STUDENT MANAGEMENT
                    </span>

                    <h1>
                        Students
                    </h1>

                    <p>
                        Add, organize and manage the students
                        in your class.
                    </p>

                </div>

                <button
                    type="button"
                    class="student-primary-btn"
                    onclick="openStudentForm()"
                >
                    <span>＋</span>
                    Add Student
                </button>

            </div>


            <div
                id="studentFormContainer"
                class="student-form-container"
                style="display:none;"
            >

                <div class="student-form-card">

                    <div class="student-form-header">

                        <div>

                            <span class="dashboard-eyebrow">
                                NEW STUDENT
                            </span>

                            <h2>
                                Add Student
                            </h2>

                        </div>

                        <button
                            type="button"
                            class="student-close-btn"
                            onclick="closeStudentForm()"
                            aria-label="Close form"
                        >
                            ×
                        </button>

                    </div>


                    <form
                        id="studentForm"
                        onsubmit="saveStudent(event)"
                    >

                        <div class="student-form-grid">


                            <div class="student-field full">

                                <label for="studentFullName">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    id="studentFullName"
                                    placeholder="Enter student's full name"
                                    autocomplete="off"
                                    required
                                >

                            </div>


                            <div class="student-field">

                                <label for="studentGender">
                                    Gender
                                </label>

                                <select
                                    id="studentGender"
                                    required
                                >

                                    <option value="">
                                        Select gender
                                    </option>

                                    <option value="Male">
                                        Male
                                    </option>

                                    <option value="Female">
                                        Female
                                    </option>

                                </select>

                            </div>


                            <div class="student-field">

                                <label for="studentDOB">
                                    Date of Birth
                                </label>

                                <input
                                    type="date"
                                    id="studentDOB"
                                >

                            </div>


                            <div class="student-field">

                                <label for="studentAdmission">
                                    Admission Number
                                </label>

                                <input
                                    type="text"
                                    id="studentAdmission"
                                    placeholder="e.g. CM/001"
                                    autocomplete="off"
                                >

                            </div>


                            <div class="student-field">

                                <label for="studentClass">
                                    Class
                                </label>

                                <input
                                    type="text"
                                    id="studentClass"
                                    value="${escapeHTML(className)}"
                                    placeholder="e.g. JSS2B"
                                    required
                                >

                            </div>


                            <div class="student-field">

                                <label for="studentSession">
                                    Session
                                </label>

                                <input
                                    type="text"
                                    id="studentSession"
                                    value="${escapeHTML(session)}"
                                    placeholder="e.g. 2026/2027"
                                    required
                                >

                            </div>


                            <div class="student-field">

                                <label for="studentTerm">
                                    Term
                                </label>

                                <select
                                    id="studentTerm"
                                    required
                                >

                                    <option value="">
                                        Select term
                                    </option>

                                    <option
                                        value="First Term"
                                        ${term === "First Term" ? "selected" : ""}
                                    >
                                        First Term
                                    </option>

                                    <option
                                        value="Second Term"
                                        ${term === "Second Term" ? "selected" : ""}
                                    >
                                        Second Term
                                    </option>

                                    <option
                                        value="Third Term"
                                        ${term === "Third Term" ? "selected" : ""}
                                    >
                                        Third Term
                                    </option>

                                </select>

                            </div>

                        </div>


                        <div
                            id="studentFormMessage"
                            class="student-form-message"
                            style="display:none;"
                        ></div>


                        <div class="student-form-actions">

                            <button
                                type="button"
                                class="student-secondary-btn"
                                onclick="closeStudentForm()"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="student-primary-btn"
                                id="saveStudentButton"
                            >
                                Save Student
                            </button>

                        </div>

                    </form>

                </div>

            </div>


            <div class="student-toolbar">

                <div class="student-search-box">

                    <span>
                        🔍
                    </span>

                    <input
                        type="search"
                        id="studentSearch"
                        placeholder="Search students..."
                        oninput="filterStudents()"
                    >

                </div>


                <div class="student-count-box">

                    <span>
                        Total Students
                    </span>

                    <strong id="studentCount">
                        0
                    </strong>

                </div>

            </div>


            <div
                id="studentListContainer"
                class="student-list-container"
            >

                <div class="student-loading">
                    Loading students...
                </div>

            </div>

        </div>

    `;
}

/* =========================================================
   OPEN STUDENT FORM
   ========================================================= */

function openStudentForm() {

    const container =
        document.getElementById(
            "studentFormContainer"
        );

    if (!container) return;

    container.style.display =
        "block";

    const nameInput =
        document.getElementById(
            "studentFullName"
        );

    if (nameInput) {
        setTimeout(() => {
            nameInput.focus();
        }, 100);
    }
}

/* =========================================================
   CLOSE STUDENT FORM
   ========================================================= */

function closeStudentForm() {

    const container =
        document.getElementById(
            "studentFormContainer"
        );

    if (container) {
        container.style.display =
            "none";
    }

    const form =
        document.getElementById(
            "studentForm"
        );

    if (form) {
        form.reset();
    }

    const profile =
        teacherProfile || {};

    const classInput =
        document.getElementById(
            "studentClass"
        );

    const sessionInput =
        document.getElementById(
            "studentSession"
        );

    if (classInput) {
        classInput.value =
            profile.class_name || "";
    }

    if (sessionInput) {
        sessionInput.value =
            profile.session || "";
    }

    hideStudentFormMessage();
}

/* =========================================================
   SAVE STUDENT
   ========================================================= */

async function saveStudent(event) {

    event.preventDefault();

    if (!currentUser || !currentUser.id) {

        showStudentFormMessage(
            "Your session has expired. Please log in again.",
            "error"
        );

        return;
    }

    const fullName =
        document
            .getElementById("studentFullName")
            ?.value
            .trim();

    const gender =
        document
            .getElementById("studentGender")
            ?.value;

    const dateOfBirth =
        document
            .getElementById("studentDOB")
            ?.value || null;

    const admissionNumber =
        document
            .getElementById("studentAdmission")
            ?.value
            .trim() || null;

    const className =
        document
            .getElementById("studentClass")
            ?.value
            .trim();

    const session =
        document
            .getElementById("studentSession")
            ?.value
            .trim();

    const term =
        document
            .getElementById("studentTerm")
            ?.value;

    if (
        !fullName ||
        !gender ||
        !className ||
        !session ||
        !term
    ) {

        showStudentFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;
    }

    const saveButton =
        document.getElementById(
            "saveStudentButton"
        );

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";
    }

    hideStudentFormMessage();

    try {

        const studentData = {

            teacher_id:
                currentUser.id,

            full_name:
                fullName,

            gender:
                gender,

            date_of_birth:
                dateOfBirth,

            admission_number:
                admissionNumber,

            class_name:
                className,

            session:
                session,

            term:
                term
        };

        const {
            data,
            error
        } =
            await supabaseClient
                .from("students")
                .insert([
                    studentData
                ])
                .select()
                .single();

        if (error) {
            throw error;
        }

        console.log(
            "Student saved:",
            data
        );

        showStudentFormMessage(
            "Student added successfully.",
            "success"
        );

        await loadStudents();

        setTimeout(() => {
            closeStudentForm();
        }, 700);

    } catch (error) {

        console.error(
            "Save student error:",
            error
        );

        showStudentFormMessage(
            getStudentErrorMessage(error),
            "error"
        );

    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Student";
        }
    }
}

/* =========================================================
   LOAD STUDENTS
   ========================================================= */

async function loadStudents() {

    const listContainer =
        document.getElementById(
            "studentListContainer"
        );

    if (!currentUser || !currentUser.id) {
        return;
    }

    try {

        if (listContainer) {

            listContainer.innerHTML = `
                <div class="student-loading">
                    Loading students...
                </div>
            `;
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .from("students")
                .select(
                    "id, teacher_id, full_name, gender, date_of_birth, admission_number, photo_url, class_name, session, term, created_at, updated_at"
                )
                .eq(
                    "teacher_id",
                    currentUser.id
                );

        if (error) {
            throw error;
        }

        studentsCache =
            Array.isArray(data)
                ? data
                : [];

        sortStudents();

        renderStudents(
            studentsCache
        );

        updateStudentCounters();

    } catch (error) {

        console.error(
            "Load students error:",
            error
        );

        if (listContainer) {

            listContainer.innerHTML = `

                <div class="student-error">

                    <div class="student-empty-icon">
                        !
                    </div>

                    <h3>
                        Unable to load students
                    </h3>

                    <p>
                        ${escapeHTML(
                            getStudentErrorMessage(error)
                        )}
                    </p>

                    <button
                        type="button"
                        class="student-secondary-btn"
                        onclick="loadStudents()"
                    >
                        Try Again
                    </button>

                </div>

            `;
        }
    }
}

/* =========================================================
   SORT STUDENTS
   ========================================================= */

function sortStudents() {

    studentsCache.sort(
        (a, b) => {

            const genderOrder = {
                Male: 1,
                Female: 2
            };

            const genderA =
                genderOrder[a.gender] || 3;

            const genderB =
                genderOrder[b.gender] || 3;

            if (genderA !== genderB) {
                return genderA - genderB;
            }

            return (
                (a.full_name || "")
                    .localeCompare(
                        b.full_name || "",
                        undefined,
                        {
                            sensitivity: "base"
                        }
                    )
            );
        }
    );
}

/* =========================================================
   RENDER STUDENTS
   ========================================================= */

function renderStudents(students) {

    const container =
        document.getElementById(
            "studentListContainer"
        );

    if (!container) return;

    if (!students || students.length === 0) {

        container.innerHTML = `

            <div class="student-empty">

                <div class="student-empty-icon">
                    👨‍🎓
                </div>

                <h3>
                    No students yet
                </h3>

                <p>
                    Start building your class list
                    by adding your first student.
                </p>

                <button
                    type="button"
                    class="student-primary-btn"
                    onclick="openStudentForm()"
                >
                    ＋ Add First Student
                </button>

            </div>

        `;

        return;
    }

    const rows =
        students
            .map(
                (student, index) =>
                    studentRow(
                        student,
                        index
                    )
            )
            .join("");

    container.innerHTML = `

        <div class="student-table-card">

            <div class="student-table-header">

                <div>
                    <strong>
                        Class Students
                    </strong>

                    <span>
                        ${students.length}
                        ${students.length === 1 ? "student" : "students"}
                    </span>
                </div>

                <button
                    type="button"
                    class="student-refresh-btn"
                    onclick="loadStudents()"
                >
                    ↻ Refresh
                </button>

            </div>

            <div class="student-table-wrap">

                <table class="student-table">

                    <thead>

                        <tr>

                            <th>
                                No.
                            </th>

                            <th>
                                Student
                            </th>

                            <th>
                                Gender
                            </th>

                            <th>
                                Admission No.
                            </th>

                            <th>
                                Class
                            </th>

                            <th>
                                Session
                            </th>

                            <th>
                                Term
                            </th>

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>

            </div>

        </div>

    `;
}

/* =========================================================
   STUDENT ROW
   ========================================================= */

function studentRow(
    student,
    index
) {

    const genderClass =
        student.gender === "Male"
            ? "male"
            : "female";

    const initials =
        getInitials(
            student.full_name
        );

    return `

        <tr>

            <td>
                <span class="student-serial">
                    ${index + 1}
                </span>
            </td>

            <td>

                <div class="student-name-cell">

                    <div class="student-avatar ${genderClass}">
                        ${escapeHTML(initials)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                student.full_name
                            )}
                        </strong>

                        <small>
                            ${student.date_of_birth
                                ? escapeHTML(
                                    formatDate(
                                        student.date_of_birth
                                    )
                                )
                                : "Date of birth not provided"}
                        </small>

                    </div>

                </div>

            </td>

            <td>

                <span
                    class="gender-badge ${genderClass}"
                >
                    ${escapeHTML(
                        student.gender || "—"
                    )}
                </span>

            </td>

            <td>
                ${escapeHTML(
                    student.admission_number || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.class_name || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.session || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.term || "—"
                )}
            </td>

            <td>

                <button
                    type="button"
                    class="student-delete-btn"
                    onclick="deleteStudent('${student.id}')"
                    title="Delete student"
                    aria-label="Delete ${escapeHTML(student.full_name)}"
                >
                    🗑
                </button>

            </td>

        </tr>

    `;
}

/* =========================================================
   SEARCH STUDENTS
   ========================================================= */

function filterStudents() {

    const searchInput =
        document.getElementById(
            "studentSearch"
        );

    if (!searchInput) return;

    const query =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!query) {

        renderStudents(
            studentsCache
        );

        return;
    }

    const filtered =
        studentsCache.filter(
            (student) => {

                return (

                    (student.full_name || "")
                        .toLowerCase()
                        .includes(query)

                    ||

                    (student.admission_number || "")
                        .toLowerCase()
                        .includes(query)

                    ||

                    (student.gender || "")
                        .toLowerCase()
                        .includes(query)

                );
            }
        );

    renderStudents(
        filtered
    );
}

/* =========================================================
   UPDATE STUDENT COUNTERS
   ========================================================= */

function updateStudentCounters() {

    const count =
        studentsCache.length;

    const studentCount =
        document.getElementById(
            "studentCount"
        );

    if (studentCount) {
        studentCount.textContent =
            count;
    }

    const dashboardCount =
        document.getElementById(
            "dashboardStudentCount"
        );

    if (dashboardCount) {
        dashboardCount.textContent =
            count;
    }
}

/* =========================================================
   DELETE STUDENT
   ========================================================= */

async function deleteStudent(studentId) {

    if (!studentId) return;

    const student =
        studentsCache.find(
            (item) =>
                item.id === studentId
        );

    if (!student) return;

    const confirmed =
        window.confirm(
            `Are you sure you want to delete ${student.full_name}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .from("students")
                .delete()
                .eq(
                    "id",
                    studentId
                )
                .eq(
                    "teacher_id",
                    currentUser.id
                );

        if (error) {
            throw error;
        }

        studentsCache =
            studentsCache.filter(
                (item) =>
                    item.id !== studentId
            );

        sortStudents();

        renderStudents(
            studentsCache
        );

        updateStudentCounters();

        alert(
            "Student deleted successfully."
        );

    } catch (error) {

        console.error(
            "Delete student error:",
            error
        );

        alert(
            getStudentErrorMessage(error)
        );
    }
}

/* =========================================================
   STUDENT ERROR MESSAGES
   ========================================================= */

function getStudentErrorMessage(error) {

    const message =
        error?.message?.toLowerCase() || "";

    if (
        message.includes(
            "row-level security"
        )
    ) {

        return (
            "Permission denied by database security. " +
            "Please make sure your teacher account is correctly authenticated."
        );
    }

    if (
        message.includes(
            "duplicate"
        )
    ) {

        return (
            "This student record already exists."
        );
    }

    return (
        error?.message ||
        "Unable to complete the student operation."
    );
}

/* =========================================================
   STUDENT FORM MESSAGE
   ========================================================= */

function showStudentFormMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "studentFormMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        "student-form-message " +
        (type === "success"
            ? "success"
            : "error");

    element.style.display =
        "block";
}

function hideStudentFormMessage() {

    const element =
        document.getElementById(
            "studentFormMessage"
        );

    if (!element) return;

    element.style.display =
        "none";

    element.textContent =
        "";
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

    sections.forEach(
        (section) => {

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
        }
    );

    const navButtons =
        document.querySelectorAll(
            ".dashboard-nav-item"
        );

    navButtons.forEach(
        (button) => {

            button.classList.remove(
                "active"
            );
        }
    );

    if (clickedButton) {

        clickedButton.classList.add(
            "active"
        );

    } else {

        navButtons.forEach(
            (button) => {

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
            }
        );
    }

    if (
        sectionName ===
        "students"
    ) {

        setTimeout(
            () => {
                loadStudents();
            },
            50
        );
    }
}

/* =========================================================
   LANDING PAGE
   ========================================================= */

function hideLandingPage() {

    const header =
        document.querySelector(
            ".header"
        );

    const main =
        document.querySelector(
            "main"
        );

    const footer =
        document.querySelector(
            "footer"
        );

    if (header) {
        header.style.display =
            "none";
    }

    if (main) {
        main.style.display =
            "none";
    }

    if (footer) {
        footer.style.display =
            "none";
    }
}

function showLandingPage() {

    const header =
        document.querySelector(
            ".header"
        );

    const main =
        document.querySelector(
            "main"
        );

    const footer =
        document.querySelector(
            "footer"
        );

    const dashboard =
        document.getElementById(
            "teacherDashboard"
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

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(value)}
            </strong>

        </div>

    `;
}

function getInitials(name) {

    if (!name) {
        return "CM";
    }

    const words =
        name
            .trim()
            .split(/\s+/);

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
   DATE FORMAT
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(
            dateValue +
            "T00:00:00"
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
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
        document.createElement(
            "style"
        );

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


        /* =====================================================
           STUDENT MANAGEMENT
           ===================================================== */

        .student-page {
            width: 100%;
        }

        .student-page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
            margin-bottom: 26px;
        }

        .student-page-header h1 {
            margin: 7px 0 8px;
            font-size: 32px;
            line-height: 1.15;
        }

        .student-page-header p {
            margin: 0;
            color: #6b7280;
            line-height: 1.6;
        }

        .student-primary-btn,
        .student-secondary-btn {
            border: 0;
            border-radius: 9px;
            padding: 11px 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: .2s ease;
        }

        .student-primary-btn {
            background: #0b1220;
            color: #ffffff;
            border: 1px solid #0b1220;
        }

        .student-primary-btn:hover {
            background: #18243a;
            transform: translateY(-1px);
        }

        .student-primary-btn:disabled {
            opacity: .55;
            cursor: not-allowed;
            transform: none;
        }

        .student-secondary-btn {
            background: #ffffff;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        .student-secondary-btn:hover {
            background: #f9fafb;
        }

        .student-form-container {
            margin-bottom: 22px;
        }

        .student-form-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 24px rgba(15,23,42,.05);
        }

        .student-form-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 22px;
        }

        .student-form-header h2 {
            margin: 6px 0 0;
            font-size: 21px;
        }

        .student-close-btn {
            width: 34px;
            height: 34px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            border-radius: 8px;
            font-size: 21px;
            color: #6b7280;
            cursor: pointer;
        }

        .student-close-btn:hover {
            background: #f3f4f6;
            color: #111827;
        }

        .student-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 17px;
        }

        .student-field {
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .student-field.full {
            grid-column: 1 / -1;
        }

        .student-field label {
            color: #374151;
            font-size: 12px;
            font-weight: 700;
        }

        .student-field input,
        .student-field select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d1d5db;
            background: #ffffff;
            color: #111827;
            border-radius: 9px;
            padding: 11px 12px;
            font-size: 13px;
            outline: none;
            transition: .2s ease;
        }

        .student-field input:focus,
        .student-field select:focus {
            border-color: #9a7b18;
            box-shadow: 0 0 0 3px rgba(212,175,55,.12);
        }

        .student-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid #edf0f4;
        }

        .student-form-message {
            border-radius: 9px;
            padding: 11px 13px;
            margin-top: 18px;
            font-size: 12px;
            line-height: 1.5;
        }

        .student-form-message.success {
            color: #047857;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
        }

        .student-form-message.error {
            color: #b91c1c;
            background: #fef2f2;
            border: 1px solid #fecaca;
        }

        .student-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 18px;
        }

        .student-search-box {
            flex: 1;
            max-width: 520px;
            display: flex;
            align-items: center;
            gap: 9px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 0 13px;
        }

        .student-search-box span {
            font-size: 14px;
        }

        .student-search-box input {
            width: 100%;
            border: 0;
            outline: 0;
            background: transparent;
            padding: 12px 0;
            color: #111827;
            font-size: 13px;
        }

        .student-count-box {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 9px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .student-count-box span {
            color: #6b7280;
            font-size: 11px;
        }

        .student-count-box strong {
            color: #0b1220;
            font-size: 18px;
        }

        .student-table-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(15,23,42,.04);
        }

        .student-table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            padding: 17px 20px;
            border-bottom: 1px solid #edf0f4;
        }

        .student-table-header strong {
            display: block;
            color: #111827;
            font-size: 14px;
        }

        .student-table-header span {
            display: block;
            color: #9ca3af;
            font-size: 11px;
            margin-top: 3px;
        }

        .student-refresh-btn {
            border: 1px solid #d1d5db;
            background: #ffffff;
            color: #374151;
            border-radius: 8px;
            padding: 8px 11px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
        }

        .student-refresh-btn:hover {
            background: #f9fafb;
        }

        .student-table-wrap {
            width: 100%;
            overflow-x: auto;
        }

        .student-table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
        }

        .student-table th {
            background: #f8fafc;
            color: #6b7280;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .7px;
            text-align: left;
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
            white-space: nowrap;
        }

        .student-table td {
            padding: 13px 14px;
            border-bottom: 1px solid #f1f5f9;
            color: #374151;
            font-size: 12px;
            vertical-align: middle;
        }

        .student-table tbody tr:hover {
            background: #fafcff;
        }

        .student-table tbody tr:last-child td {
            border-bottom: 0;
        }

        .student-serial {
            color: #9ca3af;
            font-weight: 700;
        }

        .student-name-cell {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 190px;
        }

        .student-avatar {
            width: 38px;
            height: 38px;
            flex-shrink: 0;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-size: 11px;
            font-weight: 800;
        }

        .student-avatar.male {
            background: #e8eef8;
            color: #173a6b;
        }

        .student-avatar.female {
            background: #f7eaf1;
            color: #8c315d;
        }

        .student-name-cell strong {
            display: block;
            color: #111827;
            font-size: 12px;
        }

        .student-name-cell small {
            display: block;
            color: #9ca3af;
            font-size: 10px;
            margin-top: 3px;
        }

        .gender-badge {
            display: inline-block;
            border-radius: 999px;
            padding: 5px 8px;
            font-size: 10px;
            font-weight: 700;
        }

        .gender-badge.male {
            background: #eff6ff;
            color: #1d4ed8;
        }

        .gender-badge.female {
            background: #fdf2f8;
            color: #be185d;
        }

        .student-delete-btn {
            width: 32px;
            height: 32px;
            border: 1px solid #fecaca;
            background: #fffafa;
            color: #b91c1c;
            border-radius: 7px;
            cursor: pointer;
        }

        .student-delete-btn:hover {
            background: #fef2f2;
        }

        .student-empty,
        .student-error,
        .student-loading {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 55px 25px;
            text-align: center;
            color: #6b7280;
        }

        .student-empty-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 16px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #f3f6fa;
            color: #0b1220;
            font-size: 22px;
            font-weight: 800;
        }

        .student-empty h3,
        .student-error h3 {
            margin: 0 0 8px;
            color: #111827;
            font-size: 18px;
        }

        .student-empty p,
        .student-error p {
            max-width: 500px;
            margin: 0 auto 20px;
            line-height: 1.6;
            font-size: 13px;
        }

        .student-loading {
            padding: 35px;
            font-size: 13px;
        }


        /* =====================================================
           RESPONSIVE
           ===================================================== */

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

            .student-page-header {
                align-items: flex-start;
            }

            .student-form-grid {
                grid-template-columns: 1fr;
            }

            .student-field.full {
                grid-column: auto;
            }

            .student-toolbar {
                align-items: stretch;
                flex-direction: column;
            }

            .student-search-box {
                max-width: none;
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

            .student-page-header {
                display: block;
            }

            .student-page-header h1 {
                font-size: 27px;
            }

            .student-page-header .student-primary-btn {
                width: 100%;
                margin-top: 16px;
            }

            .student-form-card {
                padding: 17px;
            }

            .student-form-actions {
                flex-direction: column-reverse;
            }

            .student-form-actions button {
                width: 100%;
            }

            .student-count-box {
                justify-content: space-between;
            }

        }

    `;

    document.head.appendChild(
        style
    );
}