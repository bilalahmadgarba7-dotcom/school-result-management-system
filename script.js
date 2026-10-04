console.log("ClassMark script loaded");

/* =========================================================
   CLASSMARK | SCHOOL RESULT MANAGEMENT
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
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
   2. GLOBAL STATE
   ========================================================= */

let currentUser = null;
let teacherProfile = null;

let studentsCache = [];
let subjectsCache = [];


/* =========================================================
   3. LOGIN MODAL
   ========================================================= */

function showLogin() {
    const modal = document.getElementById("loginModal");

    if (modal) {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");

        setTimeout(() => {
            const username =
                document.getElementById("username");

            if (username) {
                username.focus();
            }
        }, 100);
    }
}


function closeLogin() {
    const modal = document.getElementById("loginModal");

    if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    }
}


/* Close modal when clicking outside */

document.addEventListener("click", function (event) {
    const modal =
        document.getElementById("loginModal");

    if (
        modal &&
        event.target === modal
    ) {
        closeLogin();
    }
});


/* Close modal with Escape */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeLogin();
    }
});


/* =========================================================
   4. LEARN MORE
   ========================================================= */

function learnMore() {
    const featuresSection =
        document.querySelector(".features");

    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}


/* =========================================================
   5. LOGIN / AUTHENTICATION
   ========================================================= */

async function login(event) {
    event.preventDefault();

    const username =
        document.getElementById("username");

    const password =
        document.getElementById("password");

    if (!username || !password) {
        alert("Login form could not be loaded.");
        return;
    }

    const email =
        username.value.trim();

    const userPassword =
        password.value.trim();

    if (!email || !userPassword) {
        alert(
            "Please enter your email address and password."
        );
        return;
    }

    try {
        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: userPassword
            });

        if (error) {
            console.error(
                "Login error:",
                error
            );

            alert(
                "Login failed: " +
                error.message
            );

            return;
        }

        currentUser =
            data.user;

        await loadTeacherProfile();

        closeLogin();

        showTeacherDashboard();

    } catch (error) {
        console.error(
            "Unexpected login error:",
            error
        );

        alert(
            "Something went wrong while signing in."
        );
    }
}


/* =========================================================
   6. AUTH SESSION
   ========================================================= */

async function checkAuthSession() {
    try {
        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

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

            await loadTeacherProfile();

            showTeacherDashboard();
        }

    } catch (error) {
        console.error(
            "Auth check error:",
            error
        );
    }
}


/* Listen for authentication changes */

supabaseClient.auth.onAuthStateChange(
    async function (event, session) {

        console.log(
            "Auth event:",
            event
        );

        if (
            session &&
            session.user
        ) {
            currentUser =
                session.user;

            await loadTeacherProfile();

            showTeacherDashboard();

        } else {

            currentUser = null;
            teacherProfile = null;
        }
    }
);


/* =========================================================
   7. LOAD TEACHER PROFILE
   ========================================================= */

async function loadTeacherProfile() {

    if (!currentUser) {
        return null;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("Teacher")
                .select("*")
                .eq(
                    "id",
                    currentUser.id
                )
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

        return data;

    } catch (error) {

        console.error(
            "Unexpected teacher profile error:",
            error
        );

        return null;
    }
}


/* =========================================================
   8. LOGOUT
   ========================================================= */

async function logout() {

    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();

        if (error) {
            console.error(
                "Logout error:",
                error
            );

            alert(
                "Unable to sign out."
            );

            return;
        }

        currentUser = null;
        teacherProfile = null;

        studentsCache = [];
        subjectsCache = [];

        const dashboard =
            document.getElementById(
                "teacherDashboard"
            );

        if (dashboard) {
            dashboard.remove();
        }

        location.reload();

    } catch (error) {

        console.error(
            "Unexpected logout error:",
            error
        );
    }
}


/* =========================================================
   9. TEACHER DASHBOARD
   ========================================================= */

function showTeacherDashboard() {

    let dashboard =
        document.getElementById(
            "teacherDashboard"
        );

    if (dashboard) {
        dashboard.remove();
    }

    dashboard =
        document.createElement("div");

    dashboard.id =
        "teacherDashboard";

    dashboard.className =
        "teacher-dashboard";

    dashboard.innerHTML = `

        <div class="dashboard-shell">

            <!-- SIDEBAR -->

            <aside class="dashboard-sidebar">

                <div class="dashboard-brand">

                    <div class="dashboard-brand-icon">
                        CM
                    </div>

                    <div>
                        <strong>
                            ClassMark
                        </strong>

                        <span>
                            Teacher Portal
                        </span>
                    </div>

                </div>


                <nav class="dashboard-nav">

                    <button
                        type="button"
                        class="dashboard-nav-item active"
                        onclick="showDashboardSection('overview')"
                    >
                        <span>⌂</span>
                        Overview
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('students')"
                    >
                        <span>👨‍🎓</span>
                        Students
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('subjects')"
                    >
                        <span>📚</span>
                        Subjects
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('marks')"
                    >
                        <span>📝</span>
                        Enter Marks
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('ocr')"
                    >
                        <span>📷</span>
                        Score Sheet OCR
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('attendance')"
                    >
                        <span>📅</span>
                        Attendance
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('results')"
                    >
                        <span>📊</span>
                        Generate Results
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('reports')"
                    >
                        <span>📄</span>
                        Reports
                    </button>


                    <button
                        type="button"
                        class="dashboard-nav-item"
                        onclick="showDashboardSection('settings')"
                    >
                        <span>⚙️</span>
                        Settings
                    </button>

                </nav>


                <button
                    type="button"
                    class="dashboard-logout"
                    onclick="logout()"
                >
                    <span>↪</span>
                    Sign Out
                </button>

            </aside>


            <!-- MAIN -->

            <main class="dashboard-main">

                <header class="dashboard-topbar">

                    <div>

                        <p class="dashboard-kicker">
                            TEACHER DASHBOARD
                        </p>

                        <h1>
                            Welcome back,
                            ${
                                teacherProfile?.full_name ||
                                "Teacher"
                            }
                        </h1>

                    </div>


                    <div class="teacher-profile-mini">

                        <div class="teacher-avatar">
                            ${
                                getInitials(
                                    teacherProfile?.full_name ||
                                    "Teacher"
                                )
                            }
                        </div>

                        <div>

                            <strong>
                                ${
                                    teacherProfile?.full_name ||
                                    "Teacher"
                                }
                            </strong>

                            <span>
                                ${
                                    teacherProfile?.school_name ||
                                    "ClassMark Teacher"
                                }
                            </span>

                        </div>

                    </div>

                </header>


                <div
                    id="dashboardContent"
                    class="dashboard-content"
                >

                    ${overviewSection()}

                </div>

            </main>

        </div>
    `;

    document.body.appendChild(
        dashboard
    );

    addDashboardStyles();

    loadDashboardStats();
}


/* =========================================================
   10. DASHBOARD OVERVIEW
   ========================================================= */

function overviewSection() {

    return `

        <section
            class="dashboard-section"
            data-section="overview"
        >

            <div class="dashboard-section-heading">

                <div>

                    <span class="dashboard-label">
                        OVERVIEW
                    </span>

                    <h2>
                        Class Overview
                    </h2>

                    <p>
                        Manage your classroom,
                        students and academic records
                        from one place.
                    </p>

                </div>

            </div>


            <div class="dashboard-stat-grid">

                <article class="dashboard-stat-card">

                    <span class="stat-icon">
                        👨‍🎓
                    </span>

                    <div>

                        <small>
                            Students
                        </small>

                        <strong id="dashboardStudentCount">
                            0
                        </strong>

                    </div>

                </article>


                <article class="dashboard-stat-card">

                    <span class="stat-icon">
                        📚
                    </span>

                    <div>

                        <small>
                            Subjects
                        </small>

                        <strong id="dashboardSubjectCount">
                            0
                        </strong>

                    </div>

                </article>


                <article class="dashboard-stat-card">

                    <span class="stat-icon">
                        📊
                    </span>

                    <div>

                        <small>
                            Results
                        </small>

                        <strong>
                            0
                        </strong>

                    </div>

                </article>


                <article class="dashboard-stat-card">

                    <span class="stat-icon">
                        ✓
                    </span>

                    <div>

                        <small>
                            Completion
                        </small>

                        <strong>
                            0%
                        </strong>

                    </div>

                </article>

            </div>


            <div class="dashboard-two-column">

                <div class="dashboard-panel">

                    <div class="panel-heading">

                        <div>

                            <span class="dashboard-label">
                                CLASS INFORMATION
                            </span>

                            <h3>
                                ${
                                    teacherProfile?.class_name ||
                                    "Class not set"
                                }
                            </h3>

                        </div>

                    </div>


                    <div class="class-info-list">

                        <div>
                            <span>
                                School
                            </span>

                            <strong>
                                ${
                                    teacherProfile?.school_name ||
                                    "Not set"
                                }
                            </strong>
                        </div>


                        <div>
                            <span>
                                Session
                            </span>

                            <strong>
                                ${
                                    teacherProfile?.session ||
                                    "Not set"
                                }
                            </strong>
                        </div>


                        <div>
                            <span>
                                Term
                            </span>

                            <strong>
                                ${
                                    teacherProfile?.term ||
                                    "Not set"
                                }
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="dashboard-panel">

                    <div class="panel-heading">

                        <div>

                            <span class="dashboard-label">
                                QUICK ACTIONS
                            </span>

                            <h3>
                                Get Started
                            </h3>

                        </div>

                    </div>


                    <div class="quick-action-grid">

                        <button
                            type="button"
                            onclick="showDashboardSection('students')"
                        >
                            <span>👨‍🎓</span>
                            Manage Students
                        </button>


                        <button
                            type="button"
                            onclick="showDashboardSection('subjects')"
                        >
                            <span>📚</span>
                            Manage Subjects
                        </button>


                        <button
                            type="button"
                            onclick="showDashboardSection('marks')"
                        >
                            <span>📝</span>
                            Enter Marks
                        </button>


                        <button
                            type="button"
                            onclick="showDashboardSection('attendance')"
                        >
                            <span>📅</span>
                            Attendance
                        </button>

                    </div>

                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   11. STUDENT MANAGEMENT SECTION
   ========================================================= */

function studentManagementSection() {

    return `

        <section
            class="dashboard-section"
            data-section="students"
        >

            <div class="dashboard-section-heading">

                <div>

                    <span class="dashboard-label">
                        STUDENT MANAGEMENT
                    </span>

                    <h2>
                        Students
                    </h2>

                    <p>
                        Add, organize and manage students
                        in your class.
                    </p>

                </div>


                <button
                    type="button"
                    class="dashboard-primary-btn"
                    onclick="openStudentForm()"
                >
                    + Add Student
                </button>

            </div>


            <div class="student-management-toolbar">

                <div class="student-search">

                    <span>⌕</span>

                    <input
                        type="search"
                        id="studentSearch"
                        placeholder="Search students..."
                        oninput="filterStudents()"
                    >

                </div>


                <button
                    type="button"
                    class="dashboard-secondary-btn"
                    onclick="sortStudents()"
                >
                    Sort A–Z
                </button>

            </div>


            <div class="student-counter-grid">

                <div class="mini-stat">
                    <span>
                        Total Students
                    </span>

                    <strong id="studentTotalCount">
                        0
                    </strong>
                </div>


                <div class="mini-stat">
                    <span>
                        Male
                    </span>

                    <strong id="studentMaleCount">
                        0
                    </strong>
                </div>


                <div class="mini-stat">
                    <span>
                        Female
                    </span>

                    <strong id="studentFemaleCount">
                        0
                    </strong>
                </div>

            </div>


            <div class="dashboard-panel">

                <div class="panel-heading">

                    <div>

                        <span class="dashboard-label">
                            CLASS LIST
                        </span>

                        <h3>
                            Students
                        </h3>

                    </div>

                </div>


                <div
                    id="studentsTableContainer"
                    class="students-table-container"
                >

                    <div class="loading-state">
                        Loading students...
                    </div>

                </div>

            </div>

        </section>


        ${studentFormModal()}

    `;
}


/* =========================================================
   12. STUDENT FORM MODAL
   ========================================================= */

function studentFormModal() {

    return `

        <div
            id="studentFormModal"
            class="student-form-modal"
            aria-hidden="true"
        >

            <div
                class="student-form-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="studentFormTitle"
            >

                <button
                    type="button"
                    class="student-form-close"
                    onclick="closeStudentForm()"
                >
                    ×
                </button>


                <div class="student-form-header">

                    <span class="dashboard-label">
                        STUDENT RECORD
                    </span>

                    <h3 id="studentFormTitle">
                        Add Student
                    </h3>

                    <p>
                        Enter the student's information
                        below.
                    </p>

                </div>


                <form
                    id="studentForm"
                    onsubmit="saveStudent(event)"
                >

                    <div class="form-grid">

                        <div class="form-field form-field-full">

                            <label for="studentFullName">
                                Full Name
                            </label>

                            <input
                                type="text"
                                id="studentFullName"
                                placeholder="Enter student's full name"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label for="studentGender">
                                Gender
                            </label>

                            <select id="studentGender">

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


                        <div class="form-field">

                            <label for="studentDOB">
                                Date of Birth
                            </label>

                            <input
                                type="date"
                                id="studentDOB"
                            >

                        </div>


                        <div class="form-field">

                            <label for="studentAdmission">
                                Admission Number
                            </label>

                            <input
                                type="text"
                                id="studentAdmission"
                                placeholder="Optional"
                            >

                        </div>


                        <div class="form-field">

                            <label for="studentClass">
                                Class
                            </label>

                            <input
                                type="text"
                                id="studentClass"
                                value="${
                                    teacherProfile?.class_name ||
                                    ""
                                }"
                                placeholder="e.g. JSS2B"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label for="studentSession">
                                Session
                            </label>

                            <input
                                type="text"
                                id="studentSession"
                                value="${
                                    teacherProfile?.session ||
                                    ""
                                }"
                                placeholder="e.g. 2026/2027"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label for="studentTerm">
                                Term
                            </label>

                            <input
                                type="text"
                                id="studentTerm"
                                value="${
                                    teacherProfile?.term ||
                                    ""
                                }"
                                placeholder="e.g. First Term"
                                required
                            >

                        </div>

                    </div>


                    <div
                        id="studentFormError"
                        class="form-error"
                    ></div>


                    <div class="student-form-actions">

                        <button
                            type="button"
                            class="dashboard-secondary-btn"
                            onclick="closeStudentForm()"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="dashboard-primary-btn"
                        >
                            Save Student
                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;
}


/* =========================================================
   13. OPEN STUDENT FORM
   ========================================================= */

function openStudentForm() {

    const modal =
        document.getElementById(
            "studentFormModal"
        );

    if (!modal) {
        return;
    }

    const form =
        document.getElementById(
            "studentForm"
        );

    if (form) {
        form.reset();
    }

    const studentClass =
        document.getElementById(
            "studentClass"
        );

    const studentSession =
        document.getElementById(
            "studentSession"
        );

    const studentTerm =
        document.getElementById(
            "studentTerm"
        );

    if (studentClass) {
        studentClass.value =
            teacherProfile?.class_name ||
            "";
    }

    if (studentSession) {
        studentSession.value =
            teacherProfile?.session ||
            "";
    }

    if (studentTerm) {
        studentTerm.value =
            teacherProfile?.term ||
            "";
    }

    clearStudentFormError();

    modal.classList.add("active");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(() => {

        const input =
            document.getElementById(
                "studentFullName"
            );

        if (input) {
            input.focus();
        }

    }, 100);
}


/* =========================================================
   14. CLOSE STUDENT FORM
   ========================================================= */

function closeStudentForm() {

    const modal =
        document.getElementById(
            "studentFormModal"
        );

    if (modal) {

        modal.classList.remove(
            "active"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


/* =========================================================
   15. SAVE STUDENT
   ========================================================= */

async function saveStudent(event) {

    event.preventDefault();

    if (!currentUser) {

        showStudentFormError(
            "You must be logged in."
        );

        return;
    }

    const fullName =
        document
            .getElementById(
                "studentFullName"
            )
            .value
            .trim();

    const gender =
        document
            .getElementById(
                "studentGender"
            )
            .value;

    const dob =
        document
            .getElementById(
                "studentDOB"
            )
            .value || null;

    const admissionNumber =
        document
            .getElementById(
                "studentAdmission"
            )
            .value
            .trim() || null;

    const className =
        document
            .getElementById(
                "studentClass"
            )
            .value
            .trim();

    const session =
        document
            .getElementById(
                "studentSession"
            )
            .value
            .trim();

    const term =
        document
            .getElementById(
                "studentTerm"
            )
            .value
            .trim();


    if (!fullName) {

        showStudentFormError(
            "Please enter the student's full name."
        );

        return;
    }


    if (!className) {

        showStudentFormError(
            "Please enter the class."
        );

        return;
    }


    if (!session) {

        showStudentFormError(
            "Please enter the academic session."
        );

        return;
    }


    if (!term) {

        showStudentFormError(
            "Please enter the term."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#studentForm button[type='submit']"
        );

    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Saving...";
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("students")
                .insert([
                    {
                        teacher_id:
                            currentUser.id,

                        full_name:
                            fullName,

                        gender:
                            gender || null,

                        date_of_birth:
                            dob,

                        admission_number:
                            admissionNumber,

                        photo_url:
                            null,

                        class_name:
                            className,

                        session:
                            session,

                        term:
                            term
                    }
                ]);


        if (error) {

            console.error(
                "Student insert error:",
                error
            );

            showStudentFormError(
                error.message
            );

            return;
        }


        closeStudentForm();

        await loadStudents();

        await loadDashboardStats();

    } catch (error) {

        console.error(
            "Unexpected student save error:",
            error
        );

        showStudentFormError(
            "Unable to save student. Please try again."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Save Student";
        }
    }
}


/* =========================================================
   16. LOAD STUDENTS
   ========================================================= */

async function loadStudents() {

    const container =
        document.getElementById(
            "studentsTableContainer"
        );

    if (!currentUser) {
        return;
    }

    try {

        if (container) {

            container.innerHTML = `
                <div class="loading-state">
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
                .select("*")
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .order(
                    "full_name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Load students error:",
                error
            );

            if (container) {

                container.innerHTML = `
                    <div class="empty-state">
                        <strong>
                            Unable to load students
                        </strong>

                        <p>
                            ${escapeHtml(
                                error.message
                            )}
                        </p>
                    </div>
                `;
            }

            return;
        }


        studentsCache =
            data || [];

        sortStudents(false);

        renderStudents();

        updateStudentCounters();

    } catch (error) {

        console.error(
            "Unexpected load students error:",
            error
        );
    }
}


/* =========================================================
   17. SORT STUDENTS
   ========================================================= */

function sortStudents(showMessage = true) {

    studentsCache.sort(
        function (a, b) {

            const genderA =
                a.gender === "Male"
                    ? 0
                    : a.gender === "Female"
                        ? 1
                        : 2;

            const genderB =
                b.gender === "Male"
                    ? 0
                    : b.gender === "Female"
                        ? 1
                        : 2;

            if (
                genderA !==
                genderB
            ) {
                return (
                    genderA -
                    genderB
                );
            }

            return (
                (a.full_name || "")
                    .toLowerCase()
                    .localeCompare(
                        (
                            b.full_name ||
                            ""
                        )
                            .toLowerCase()
                    )
            );
        }
    );

    renderStudents();

    updateStudentCounters();
}


/* =========================================================
   18. RENDER STUDENTS
   ========================================================= */

function renderStudents() {

    const container =
        document.getElementById(
            "studentsTableContainer"
        );

    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "studentSearch"
        );

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    let filteredStudents =
        studentsCache;


    if (search) {

        filteredStudents =
            studentsCache.filter(
                function (student) {

                    return (
                        (
                            student.full_name ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)
                        ||
                        (
                            student.admission_number ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)
                    );
                }
            );
    }


    if (
        filteredStudents.length ===
        0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    👨‍🎓
                </div>

                <strong>
                    ${
                        search
                            ? "No matching students"
                            : "No students yet"
                    }
                </strong>

                <p>
                    ${
                        search
                            ? "Try a different search."
                            : "Add your first student to begin."
                    }
                </p>

                ${
                    !search
                        ? `
                            <button
                                type="button"
                                class="dashboard-primary-btn"
                                onclick="openStudentForm()"
                            >
                                + Add Student
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        return;
    }


    let html = `

        <div class="students-table">

            <div class="students-table-header">

                <span>
                    #
                </span>

                <span>
                    Student
                </span>

                <span>
                    Gender
                </span>

                <span>
                    Admission No.
                </span>

                <span>
                    Class
                </span>

                <span>
                    Action
                </span>

            </div>
    `;


    filteredStudents.forEach(
        function (student, index) {

            html += studentRow(
                student,
                index + 1
            );
        }
    );


    html += `
        </div>
    `;


    container.innerHTML =
        html;
}


/* =========================================================
   19. STUDENT ROW
   ========================================================= */

function studentRow(
    student,
    serial
) {

    const genderClass =
        student.gender === "Male"
            ? "gender-male"
            : student.gender === "Female"
                ? "gender-female"
                : "";


    return `

        <div class="student-table-row">

            <span class="student-serial">
                ${serial}
            </span>


            <div class="student-name-cell">

                <div class="student-avatar">

                    ${
                        getInitials(
                            student.full_name ||
                            "Student"
                        )
                    }

                </div>

                <div>

                    <strong>
                        ${escapeHtml(
                            student.full_name ||
                            "Unnamed Student"
                        )}
                    </strong>

                    ${
                        student.date_of_birth
                            ? `
                                <small>
                                    DOB:
                                    ${escapeHtml(
                                        student.date_of_birth
                                    )}
                                </small>
                            `
                            : ""
                    }

                </div>

            </div>


            <span>
                ${
                    student.gender
                        ? `
                            <span
                                class="gender-badge ${genderClass}"
                            >
                                ${escapeHtml(
                                    student.gender
                                )}
                            </span>
                        `
                        : "—"
                }
            </span>


            <span>
                ${
                    student.admission_number
                        ? escapeHtml(
                            student.admission_number
                        )
                        : "—"
                }
            </span>


            <span>
                ${
                    escapeHtml(
                        student.class_name ||
                        "—"
                    )
                }
            </span>


            <div class="student-action-cell">

                <button
                    type="button"
                    class="student-delete-btn"
                    onclick="deleteStudent('${student.id}')"
                    title="Delete student"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   20. FILTER STUDENTS
   ========================================================= */

function filterStudents() {
    renderStudents();
}


/* =========================================================
   21. UPDATE STUDENT COUNTERS
   ========================================================= */

function updateStudentCounters() {

    const total =
        studentsCache.length;

    const male =
        studentsCache.filter(
            student =>
                student.gender === "Male"
        ).length;

    const female =
        studentsCache.filter(
            student =>
                student.gender === "Female"
        ).length;


    const totalElement =
        document.getElementById(
            "studentTotalCount"
        );

    const maleElement =
        document.getElementById(
            "studentMaleCount"
        );

    const femaleElement =
        document.getElementById(
            "studentFemaleCount"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (maleElement) {
        maleElement.textContent =
            male;
    }

    if (femaleElement) {
        femaleElement.textContent =
            female;
    }


    const dashboardStudentCount =
        document.getElementById(
            "dashboardStudentCount"
        );

    if (dashboardStudentCount) {
        dashboardStudentCount.textContent =
            total;
    }
}


/* =========================================================
   22. DELETE STUDENT
   ========================================================= */

async function deleteStudent(
    studentId
) {

    if (!studentId) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this student?"
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

            console.error(
                "Delete student error:",
                error
            );

            alert(
                "Unable to delete student: " +
                error.message
            );

            return;
        }


        await loadStudents();

        await loadDashboardStats();

    } catch (error) {

        console.error(
            "Unexpected delete error:",
            error
        );

        alert(
            "Something went wrong while deleting the student."
        );
    }
}


/* =========================================================
   23. STUDENT FORM ERROR
   ========================================================= */

function showStudentFormError(
    message
) {

    const errorElement =
        document.getElementById(
            "studentFormError"
        );

    if (errorElement) {
        errorElement.textContent =
            message;
        errorElement.classList.add(
            "active"
        );
    }
}


function clearStudentFormError() {

    const errorElement =
        document.getElementById(
            "studentFormError"
        );

    if (errorElement) {

        errorElement.textContent =
            "";

        errorElement.classList.remove(
            "active"
        );
    }
}


/* =========================================================
   24. SUBJECT MANAGEMENT
   ========================================================= */

function subjectManagementSection() {

    return `

        <section
            class="dashboard-section"
            data-section="subjects"
        >

            <div class="dashboard-section-heading">

                <div>

                    <span class="dashboard-label">
                        SUBJECT MANAGEMENT
                    </span>

                    <h2>
                        Subjects
                    </h2>

                    <p>
                        Configure the subjects used
                        for your class.
                    </p>

                </div>


                <button
                    type="button"
                    class="dashboard-primary-btn"
                    onclick="openSubjectForm()"
                >
                    + Add Subject
                </button>

            </div>


            <div class="dashboard-panel">

                <div class="panel-heading">

                    <div>

                        <span class="dashboard-label">
                            SUBJECT LIST
                        </span>

                        <h3>
                            Your Subjects
                        </h3>

                    </div>

                </div>


                <div
                    id="subjectsTableContainer"
                    class="subjects-table-container"
                >

                    <div class="loading-state">
                        Loading subjects...
                    </div>

                </div>

            </div>

        </section>


        ${subjectFormModal()}

    `;
}


/* =========================================================
   25. SUBJECT FORM
   ========================================================= */

function subjectFormModal() {

    return `

        <div
            id="subjectFormModal"
            class="student-form-modal"
            aria-hidden="true"
        >

            <div
                class="student-form-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="subjectFormTitle"
            >

                <button
                    type="button"
                    class="student-form-close"
                    onclick="closeSubjectForm()"
                >
                    ×
                </button>


                <div class="student-form-header">

                    <span class="dashboard-label">
                        SUBJECT RECORD
                    </span>

                    <h3 id="subjectFormTitle">
                        Add Subject
                    </h3>

                    <p>
                        Add a subject for this class.
                    </p>

                </div>


                <form
                    id="subjectForm"
                    onsubmit="saveSubject(event)"
                >

                    <div class="form-grid">

                        <div class="form-field form-field-full">

                            <label for="subjectName">
                                Subject Name
                            </label>

                            <input
                                type="text"
                                id="subjectName"
                                placeholder="e.g. Mathematics"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label for="subjectCode">
                                Subject Code
                            </label>

                            <input
                                type="text"
                                id="subjectCode"
                                placeholder="Optional"
                            >

                        </div>


                        <div class="form-field">

                            <label for="subjectClass">
                                Class
                            </label>

                            <input
                                type="text"
                                id="subjectClass"
                                value="${
                                    teacherProfile?.class_name ||
                                    ""
                                }"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label for="subjectSession">
                                Session
                            </label>

                            <input
                                type="text"
                                id="subjectSession"
                                value="${
                                    teacherProfile?.session ||
                                    ""
                                }"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label for="subjectTerm">
                                Term
                            </label>

                            <input
                                type="text"
                                id="subjectTerm"
                                value="${
                                    teacherProfile?.term ||
                                    ""
                                }"
                                required
                            >

                        </div>

                    </div>


                    <div
                        id="subjectFormError"
                        class="form-error"
                    ></div>


                    <div class="student-form-actions">

                        <button
                            type="button"
                            class="dashboard-secondary-btn"
                            onclick="closeSubjectForm()"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="dashboard-primary-btn"
                        >
                            Save Subject
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;
}


/* =========================================================
   26. OPEN SUBJECT FORM
   ========================================================= */

function openSubjectForm() {

    const modal =
        document.getElementById(
            "subjectFormModal"
        );

    if (!modal) {
        return;
    }


    const form =
        document.getElementById(
            "subjectForm"
        );

    if (form) {
        form.reset();
    }


    const subjectClass =
        document.getElementById(
            "subjectClass"
        );

    const subjectSession =
        document.getElementById(
            "subjectSession"
        );

    const subjectTerm =
        document.getElementById(
            "subjectTerm"
        );


    if (subjectClass) {
        subjectClass.value =
            teacherProfile?.class_name ||
            "";
    }

    if (subjectSession) {
        subjectSession.value =
            teacherProfile?.session ||
            "";
    }

    if (subjectTerm) {
        subjectTerm.value =
            teacherProfile?.term ||
            "";
    }


    clearSubjectFormError();


    modal.classList.add(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   27. CLOSE SUBJECT FORM
   ========================================================= */

function closeSubjectForm() {

    const modal =
        document.getElementById(
            "subjectFormModal"
        );

    if (modal) {

        modal.classList.remove(
            "active"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


/* =========================================================
   28. SAVE SUBJECT
   ========================================================= */

async function saveSubject(event) {

    event.preventDefault();


    if (!currentUser) {

        showSubjectFormError(
            "You must be logged in."
        );

        return;
    }


    const subjectName =
        document
            .getElementById(
                "subjectName"
            )
            .value
            .trim();


    const subjectCode =
        document
            .getElementById(
                "subjectCode"
            )
            .value
            .trim() || null;


    const className =
        document
            .getElementById(
                "subjectClass"
            )
            .value
            .trim();


    const session =
        document
            .getElementById(
                "subjectSession"
            )
            .value
            .trim();


    const term =
        document
            .getElementById(
                "subjectTerm"
            )
            .value
            .trim();


    if (!subjectName) {

        showSubjectFormError(
            "Please enter the subject name."
        );

        return;
    }


    if (!className) {

        showSubjectFormError(
            "Please enter the class."
        );

        return;
    }


    if (!session) {

        showSubjectFormError(
            "Please enter the academic session."
        );

        return;
    }


    if (!term) {

        showSubjectFormError(
            "Please enter the term."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#subjectForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Saving...";
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("subjects")
                .insert([
                    {
                        teacher_id:
                            currentUser.id,

                        subject_name:
                            subjectName,

                        subject_code:
                            subjectCode,

                        class_name:
                            className,

                        session:
                            session,

                        term:
                            term
                    }
                ]);


        if (error) {

            console.error(
                "Subject insert error:",
                error
            );

            showSubjectFormError(
                error.message
            );

            return;
        }


        closeSubjectForm();

        await loadSubjects();

        await loadDashboardStats();

    } catch (error) {

        console.error(
            "Unexpected subject save error:",
            error
        );

        showSubjectFormError(
            "Unable to save subject. Please try again."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Save Subject";
        }
    }
}


/* =========================================================
   29. LOAD SUBJECTS
   ========================================================= */

async function loadSubjects() {

    const container =
        document.getElementById(
            "subjectsTableContainer"
        );


    if (!currentUser) {
        return;
    }


    try {

        if (container) {

            container.innerHTML = `
                <div class="loading-state">
                    Loading subjects...
                </div>
            `;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("subjects")
                .select("*")
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .order(
                    "subject_name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Load subjects error:",
                error
            );

            if (container) {

                container.innerHTML = `
                    <div class="empty-state">

                        <strong>
                            Unable to load subjects
                        </strong>

                        <p>
                            ${escapeHtml(
                                error.message
                            )}
                        </p>

                    </div>
                `;
            }

            return;
        }


        subjectsCache =
            data || [];


        renderSubjects();


        const dashboardSubjectCount =
            document.getElementById(
                "dashboardSubjectCount"
            );

        if (
            dashboardSubjectCount
        ) {

            dashboardSubjectCount.textContent =
                subjectsCache.length;
        }


    } catch (error) {

        console.error(
            "Unexpected load subjects error:",
            error
        );
    }
}


/* =========================================================
   30. RENDER SUBJECTS
   ========================================================= */

function renderSubjects() {

    const container =
        document.getElementById(
            "subjectsTableContainer"
        );


    if (!container) {
        return;
    }


    if (
        subjectsCache.length ===
        0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📚
                </div>

                <strong>
                    No subjects yet
                </strong>

                <p>
                    Add your first subject
                    to begin managing marks.
                </p>


                <button
                    type="button"
                    class="dashboard-primary-btn"
                    onclick="openSubjectForm()"
                >
                    + Add Subject
                </button>

            </div>
        `;

        return;
    }


    let html = `

        <div class="subjects-table">

            <div class="subjects-table-header">

                <span>
                    #
                </span>

                <span>
                    Subject
                </span>

                <span>
                    Code
                </span>

                <span>
                    Class
                </span>

                <span>
                    Session
                </span>

                <span>
                    Term
                </span>

                <span>
                    Action
                </span>

            </div>
    `;


    subjectsCache.forEach(
        function (subject, index) {

            html += `

                <div class="subject-table-row">

                    <span>
                        ${index + 1}
                    </span>


                    <strong>
                        ${escapeHtml(
                            subject.subject_name ||
                            "Unnamed Subject"
                        )}
                    </strong>


                    <span>
                        ${
                            subject.subject_code
                                ? escapeHtml(
                                    subject.subject_code
                                )
                                : "—"
                        }
                    </span>


                    <span>
                        ${escapeHtml(
                            subject.class_name ||
                            "—"
                        )}
                    </span>


                    <span>
                        ${escapeHtml(
                            subject.session ||
                            "—"
                        )}
                    </span>


                    <span>
                        ${escapeHtml(
                            subject.term ||
                            "—"
                        )}
                    </span>


                    <div>

                        <button
                            type="button"
                            class="student-delete-btn"
                            onclick="deleteSubject('${subject.id}')"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;
        }
    );


    html += `
        </div>
    `;


    container.innerHTML =
        html;
}


/* =========================================================
   31. DELETE SUBJECT
   ========================================================= */

async function deleteSubject(
    subjectId
) {

    if (!subjectId) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this subject?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("subjects")
                .delete()
                .eq(
                    "id",
                    subjectId
                )
                .eq(
                    "teacher_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "Delete subject error:",
                error
            );

            alert(
                "Unable to delete subject: " +
                error.message
            );

            return;
        }


        await loadSubjects();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Unexpected delete subject error:",
            error
        );

        alert(
            "Something went wrong while deleting the subject."
        );
    }
}


/* =========================================================
   32. SUBJECT FORM ERROR
   ========================================================= */

function showSubjectFormError(
    message
) {

    const errorElement =
        document.getElementById(
            "subjectFormError"
        );

    if (errorElement) {

        errorElement.textContent =
            message;

        errorElement.classList.add(
            "active"
        );
    }
}


function clearSubjectFormError() {

    const errorElement =
        document.getElementById(
            "subjectFormError"
        );

    if (errorElement) {

        errorElement.textContent =
            "";

        errorElement.classList.remove(
            "active"
        );
    }
}


/* =========================================================
   33. OTHER DASHBOARD SECTIONS
   ========================================================= */

function comingSoonSection(
    title,
    description
) {

    return `

        <section
            class="dashboard-section"
        >

            <div class="dashboard-section-heading">

                <div>

                    <span class="dashboard-label">
                        CLASSMARK
                    </span>

                    <h2>
                        ${escapeHtml(title)}
                    </h2>

                    <p>
                        ${escapeHtml(description)}
                    </p>

                </div>

            </div>


            <div class="dashboard-panel">

                <div class="coming-soon">

                    <div class="coming-soon-icon">
                        ✦
                    </div>

                    <h3>
                        Coming Soon
                    </h3>

                    <p>
                        This module is part of
                        the ClassMark roadmap and
                        will be activated soon.
                    </p>

                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   34. SHOW DASHBOARD SECTION
   ========================================================= */

function showDashboardSection(
    sectionName
) {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    if (!content) {
        return;
    }


    let html = "";


    switch (sectionName) {

        case "overview":

            html =
                overviewSection();

            break;


        case "students":

            html =
                studentManagementSection();

            break;


        case "subjects":

            html =
                subjectManagementSection();

            break;


        case "marks":

            html =
                comingSoonSection(
                    "Enter Marks",
                    "Record CA and examination marks for each subject."
                );

            break;


        case "ocr":

            html =
                comingSoonSection(
                    "Score Sheet OCR",
                    "Upload score sheets and extract marks using OCR."
                );

            break;


        case "attendance":

            html =
                comingSoonSection(
                    "Attendance",
                    "Record student attendance and calculate attendance percentages."
                );

            break;


        case "results":

            html =
                comingSoonSection(
                    "Generate Results",
                    "Calculate totals, averages, grades and class positions."
                );

            break;


        case "reports":

            html =
                comingSoonSection(
                    "Reports",
                    "Generate professional student and class result reports."
                );

            break;


        case "settings":

            html =
                comingSoonSection(
                    "Settings",
                    "Manage your ClassMark classroom settings."
                );

            break;


        default:

            html =
                overviewSection();
    }


    content.innerHTML =
        html;


    updateActiveDashboardNav(
        sectionName
    );


    if (
        sectionName ===
        "students"
    ) {

        loadStudents();
    }


    if (
        sectionName ===
        "subjects"
    ) {

        loadSubjects();
    }
}


/* =========================================================
   35. ACTIVE NAVIGATION
   ========================================================= */

function updateActiveDashboardNav(
    sectionName
) {

    const buttons =
        document.querySelectorAll(
            ".dashboard-nav-item"
        );


    buttons.forEach(
        function (button) {

            button.classList.remove(
                "active"
            );

            const onclick =
                button.getAttribute(
                    "onclick"
                ) || "";

            if (
                onclick.includes(
                    "'" +
                    sectionName +
                    "'"
                )
            ) {

                button.classList.add(
                    "active"
                );
            }
        }
    );
}


/* =========================================================
   36. DASHBOARD STATS
   ========================================================= */

async function loadDashboardStats() {

    if (!currentUser) {
        return;
    }


    try {

        const studentResult =
            await supabaseClient
                .from("students")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "teacher_id",
                    currentUser.id
                );


        const subjectResult =
            await supabaseClient
                .from("subjects")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "teacher_id",
                    currentUser.id
                );


        const studentCount =
            studentResult.count || 0;

        const subjectCount =
            subjectResult.count || 0;


        const studentElement =
            document.getElementById(
                "dashboardStudentCount"
            );

        const subjectElement =
            document.getElementById(
                "dashboardSubjectCount"
            );


        if (studentElement) {

            studentElement.textContent =
                studentCount;
        }


        if (subjectElement) {

            subjectElement.textContent =
                subjectCount;
        }


    } catch (error) {

        console.error(
            "Dashboard stats error:",
            error
        );
    }
}


/* =========================================================
   37. INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkAuthSession();

    }
);


/* =========================================================
   38. HELPERS
   ========================================================= */

function getInitials(
    name
) {

    if (!name) {
        return "CM";
    }


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length ===
        1
    ) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


function escapeHtml(
    value
) {

    if (
        value ===
        null ||
        value ===
        undefined
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
   39. DASHBOARD STYLES
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

        .teacher-dashboard {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: #f5f7fb;
            overflow: auto;
            color: #111827;
        }


        .dashboard-shell {
            min-height: 100vh;
            display: flex;
        }


        .dashboard-sidebar {
            width: 260px;
            background: #07101d;
            color: white;
            padding: 22px 16px;
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: 100vh;
        }


        .dashboard-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            margin-bottom: 28px;
        }


        .dashboard-brand-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(
                135deg,
                #d4af37,
                #f3d77a
            );
            color: #07101d;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
        }


        .dashboard-brand strong {
            display: block;
            font-size: 18px;
        }


        .dashboard-brand span {
            display: block;
            color: #9ca3af;
            font-size: 11px;
            margin-top: 3px;
        }


        .dashboard-nav {
            display: grid;
            gap: 7px;
        }


        .dashboard-nav-item {
            width: 100%;
            border: 0;
            background: transparent;
            color: #cbd5e1;
            padding: 12px 13px;
            border-radius: 10px;
            text-align: left;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 11px;
            font-size: 13px;
            transition: .2s ease;
        }


        .dashboard-nav-item:hover,
        .dashboard-nav-item.active {
            background: rgba(
                212,
                175,
                55,
                .12
            );
            color: #f3d77a;
        }


        .dashboard-logout {
            margin-top: auto;
            border: 1px solid rgba(
                255,
                255,
                255,
                .08
            );
            background: transparent;
            color: #cbd5e1;
            padding: 11px 13px;
            border-radius: 10px;
            cursor: pointer;
            text-align: left;
        }


        .dashboard-main {
            flex: 1;
            min-width: 0;
        }


        .dashboard-topbar {
            min-height: 82px;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 18px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }


        .dashboard-kicker,
        .dashboard-label {
            color: #b08b16;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .12em;
            margin: 0 0 6px;
        }


        .dashboard-topbar h1 {
            margin: 0;
            font-size: 22px;
            color: #111827;
        }


        .teacher-profile-mini {
            display: flex;
            align-items: center;
            gap: 10px;
        }


        .teacher-profile-mini strong {
            display: block;
            font-size: 13px;
        }


        .teacher-profile-mini span {
            display: block;
            font-size: 11px;
            color: #6b7280;
            margin-top: 3px;
        }


        .teacher-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #0b1220;
            color: #f3d77a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 800;
        }


        .dashboard-content {
            padding: 28px;
        }


        .dashboard-section-heading {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
        }


        .dashboard-section-heading h2 {
            margin: 0;
            font-size: 27px;
            color: #111827;
        }


        .dashboard-section-heading p {
            margin: 8px 0 0;
            color: #6b7280;
            max-width: 650px;
            line-height: 1.6;
        }


        .dashboard-stat-grid {
            display: grid;
            grid-template-columns: repeat(
                4,
                minmax(0, 1fr)
            );
            gap: 15px;
            margin-bottom: 20px;
        }


        .dashboard-stat-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 14px;
        }


        .stat-icon {
            width: 43px;
            height: 43px;
            border-radius: 11px;
            background: #fff8df;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }


        .dashboard-stat-card small {
            display: block;
            color: #6b7280;
            font-size: 11px;
        }


        .dashboard-stat-card strong {
            display: block;
            font-size: 23px;
            margin-top: 3px;
        }


        .dashboard-two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }


        .dashboard-panel {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 15px;
            padding: 20px;
        }


        .panel-heading {
            display: flex;
            justify-content: space-between;
            margin-bottom: 18px;
        }


        .panel-heading h3 {
            margin: 0;
            font-size: 18px;
        }


        .class-info-list {
            display: grid;
            gap: 13px;
        }


        .class-info-list > div {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #eef0f4;
        }


        .class-info-list span {
            color: #6b7280;
            font-size: 12px;
        }


        .class-info-list strong {
            text-align: right;
            font-size: 13px;
        }


        .quick-action-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }


        .quick-action-grid button {
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 11px;
            padding: 13px;
            text-align: left;
            cursor: pointer;
            color: #111827;
            font-size: 12px;
        }


        .quick-action-grid button:hover {
            border-color: #d4af37;
            background: #fffdf4;
        }


        .quick-action-grid span {
            display: block;
            margin-bottom: 7px;
            font-size: 17px;
        }


        .dashboard-primary-btn {
            border: 0;
            background: linear-gradient(
                135deg,
                #c49a22,
                #e1c45b
            );
            color: #111827;
            padding: 11px 16px;
            border-radius: 9px;
            font-weight: 800;
            cursor: pointer;
            font-size: 12px;
        }


        .dashboard-primary-btn:hover {
            transform: translateY(-1px);
        }


        .dashboard-primary-btn:disabled {
            opacity: .6;
            cursor: not-allowed;
        }


        .dashboard-secondary-btn {
            border: 1px solid #d8dde5;
            background: white;
            color: #374151;
            padding: 10px 15px;
            border-radius: 9px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
        }


        .student-management-toolbar {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 16px;
        }


        .student-search {
            flex: 1;
            max-width: 450px;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #dfe3e8;
            background: white;
            border-radius: 9px;
            padding: 0 12px;
        }


        .student-search input {
            width: 100%;
            border: 0;
            outline: 0;
            padding: 11px 0;
            font-size: 13px;
        }


        .student-counter-grid {
            display: grid;
            grid-template-columns: repeat(
                3,
                1fr
            );
            gap: 12px;
            margin-bottom: 16px;
        }


        .mini-stat {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 15px;
        }


        .mini-stat span {
            display: block;
            color: #6b7280;
            font-size: 11px;
        }


        .mini-stat strong {
            display: block;
            margin-top: 5px;
            font-size: 20px;
        }


        .students-table,
        .subjects-table {
            width: 100%;
            overflow-x: auto;
        }


        .students-table-header,
        .student-table-row {
            min-width: 850px;
            display: grid;
            grid-template-columns:
                40px
                2fr
                1fr
                1.2fr
                1fr
                90px;
            gap: 12px;
            align-items: center;
        }


        .subjects-table-header,
        .subject-table-row {
            min-width: 900px;
            display: grid;
            grid-template-columns:
                40px
                2fr
                1fr
                1fr
                1.2fr
                1fr
                80px;
            gap: 12px;
            align-items: center;
        }


        .students-table-header,
        .subjects-table-header {
            padding: 11px 10px;
            background: #f8fafc;
            color: #6b7280;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .05em;
        }


        .student-table-row,
        .subject-table-row {
            padding: 13px 10px;
            border-bottom: 1px solid #eef0f4;
            font-size: 12px;
        }


        .student-name-cell {
            display: flex;
            align-items: center;
            gap: 9px;
        }


        .student-avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #0b1220;
            color: #e7c85b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
            flex-shrink: 0;
        }


        .student-name-cell strong {
            display: block;
            font-size: 12px;
        }


        .student-name-cell small {
            display: block;
            color: #9ca3af;
            margin-top: 3px;
            font-size: 9px;
        }


        .gender-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 800;
        }


        .gender-male {
            background: #e8f1ff;
            color: #2457a6;
        }


        .gender-female {
            background: #fff0f5;
            color: #a63d6b;
        }


        .student-delete-btn {
            border: 1px solid #efcaca;
            background: #fff7f7;
            color: #b42318;
            padding: 7px 9px;
            border-radius: 7px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 700;
        }


        .loading-state,
        .empty-state {
            padding: 45px 20px;
            text-align: center;
            color: #6b7280;
        }


        .empty-state-icon {
            font-size: 30px;
            margin-bottom: 10px;
        }


        .empty-state strong {
            display: block;
            color: #111827;
            margin-bottom: 6px;
        }


        .empty-state p {
            margin: 0 0 15px;
            font-size: 12px;
        }


        .student-form-modal {
            position: fixed;
            inset: 0;
            background: rgba(
                3,
                8,
                18,
                .65
            );
            z-index: 100000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }


        .student-form-modal.active {
            display: flex;
        }


        .student-form-content {
            width: min(
                650px,
                100%
            );
            max-height: 90vh;
            overflow-y: auto;
            background: white;
            border-radius: 17px;
            padding: 25px;
            position: relative;
        }


        .student-form-close {
            position: absolute;
            top: 12px;
            right: 14px;
            width: 34px;
            height: 34px;
            border: 0;
            background: #f3f4f6;
            border-radius: 50%;
            font-size: 21px;
            cursor: pointer;
        }


        .student-form-header {
            margin-bottom: 20px;
            padding-right: 35px;
        }


        .student-form-header h3 {
            margin: 0;
            font-size: 22px;
        }


        .student-form-header p {
            color: #6b7280;
            font-size: 12px;
            margin: 6px 0 0;
        }


        .form-grid {
            display: grid;
            grid-template-columns:
                1fr
                1fr;
            gap: 14px;
        }


        .form-field {
            display: grid;
            gap: 6px;
        }


        .form-field-full {
            grid-column: 1 / -1;
        }


        .form-field label {
            font-size: 11px;
            font-weight: 800;
            color: #374151;
        }


        .form-field input,
        .form-field select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d9dee7;
            border-radius: 8px;
            padding: 11px;
            outline: none;
            font-size: 12px;
            background: white;
        }


        .form-field input:focus,
        .form-field select:focus {
            border-color: #c49a22;
            box-shadow: 0 0 0 3px rgba(
                196,
                154,
                34,
                .1
            );
        }


        .form-error {
            display: none;
            margin-top: 14px;
            background: #fff1f1;
            border: 1px solid #f0c4c4;
            color: #b42318;
            padding: 10px;
            border-radius: 8px;
            font-size: 11px;
        }


        .form-error.active {
            display: block;
        }


        .student-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }


        .coming-soon {
            text-align: center;
            padding: 55px 20px;
        }


        .coming-soon-icon {
            width: 55px;
            height: 55px;
            margin: 0 auto 14px;
            border-radius: 50%;
            background: #fff8df;
            color: #b08b16;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }


        .coming-soon h3 {
            margin: 0 0 7px;
        }


        .coming-soon p {
            max-width: 500px;
            margin: auto;
            color: #6b7280;
            font-size: 12px;
            line-height: 1.6;
        }


        @media (max-width: 950px) {

            .dashboard-sidebar {
                width: 220px;
            }


            .dashboard-stat-grid {
                grid-template-columns:
                    1fr 1fr;
            }


            .dashboard-two-column {
                grid-template-columns:
                    1fr;
            }
        }


        @media (max-width: 720px) {

            .dashboard-shell {
                display: block;
            }


            .dashboard-sidebar {
                position: relative;
                width: auto;
                height: auto;
            }


            .dashboard-nav {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }


            .dashboard-logout {
                margin-top: 15px;
            }


            .dashboard-topbar {
                padding: 16px;
            }


            .dashboard-content {
                padding: 16px;
            }


            .teacher-profile-mini {
                display: none;
            }


            .dashboard-section-heading {
                flex-direction: column;
            }


            .dashboard-stat-grid {
                grid-template-columns:
                    1fr 1fr;
            }
        }


        @media (max-width: 520px) {

            .dashboard-stat-grid {
                grid-template-columns:
                    1fr;
            }


            .student-counter-grid {
                grid-template-columns:
                    1fr;
            }


            .student-management-toolbar {
                flex-direction: column;
            }


            .student-search {
                max-width: none;
            }


            .form-grid {
                grid-template-columns:
                    1fr;
            }


            .form-field-full {
                grid-column: auto;
            }


            .student-form-content {
                padding: 20px;
            }

        }

    `;


    document.head.appendChild(
        style
    );
}