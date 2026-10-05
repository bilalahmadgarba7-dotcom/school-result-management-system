// ==========================================
// CLASSMARK
// School Result Management System
// ==========================================


// ------------------------------------------
// SUPABASE CONFIGURATION
// ------------------------------------------

const SUPABASE_URL =
    "https://wzqcjbuotsipshjgrboo.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOxjGpA_-d_W4o6m";


// ------------------------------------------
// SUPABASE CLIENT
// ------------------------------------------

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY
    );


// ------------------------------------------
// APPLICATION STATE
// ------------------------------------------

let currentUser = null;
let teacherProfile = null;

let studentsCache = [];
let subjectsCache = [];

let editingStudentId = null;
let editingSubjectId = null;


// ------------------------------------------
// APP START
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "ClassMark application started."
        );

        await checkAuthentication();

    }
);


// ------------------------------------------
// CHECK AUTHENTICATION
// ------------------------------------------

async function checkAuthentication() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            return;

        }


        if (data.session) {

            currentUser =
                data.session.user;

            console.log(
                "User is authenticated:",
                currentUser.email
            );

        } else {

            console.log(
                "No authenticated user."
            );

        }

    } catch (error) {

        console.error(
            "Unexpected authentication error:",
            error
        );

    }

}


// ------------------------------------------
// AUTH STATE LISTENER
// ------------------------------------------

supabaseClient
    .auth
    .onAuthStateChange(
        async function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                currentUser =
                    session.user;


                if (
                    !teacherProfile &&
                    !document.getElementById(
                        "teacherDashboard"
                    )
                ) {

                    await loadTeacherProfile();


                    if (teacherProfile) {

                        showTeacherDashboard();

                    }

                }


            } else {

                currentUser = null;

                teacherProfile = null;

                editingStudentId = null;

                editingSubjectId = null;

                studentsCache = [];

                subjectsCache = [];

            }

        }
    );


// ==========================================
// TEACHER LOGIN
// ==========================================

async function login(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("username")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


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

        submitButton.disabled = true;

        submitButton.textContent =
            "Signing in...";

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email: email,
                    password: password
                });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Login failed. Please check your email and password."
            );

            return;

        }


        currentUser =
            data.user;


        await loadTeacherProfile();


        if (!teacherProfile) {

            return;

        }


        showTeacherDashboard();


        console.log(
            "Login successful:",
            currentUser.email
        );


        closeLogin();


        alert(
            "Welcome to ClassMark!"
        );


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Sign In to ClassMark";

        }

    }

}


// ==========================================
// LOAD TEACHER PROFILE
// ==========================================

async function loadTeacherProfile() {

    if (!currentUser) {

        console.warn(
            "Cannot load teacher profile: no authenticated user."
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
                .select(`
                    id,
                    full_name,
                    phone,
                    username,
                    email,
                    school_name,
                    class_name,
                    session,
                    term
                `)
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Teacher profile error:",
                error
            );

            alert(
                "Unable to load your teacher profile."
            );

            return null;

        }


        if (!data) {

            console.warn(
                "No teacher profile found."
            );

            alert(
                "Your teacher profile was not found."
            );

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
            "Unexpected teacher profile error:",
            error
        );

        alert(
            "Something went wrong while loading your profile."
        );

        return null;

    }

}


// ==========================================
// TEACHER DASHBOARD
// ==========================================

function showTeacherDashboard() {

    const loginModal =
        document.getElementById("loginModal");


    if (loginModal) {

        loginModal.classList.remove("active");

        loginModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    const existingDashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (existingDashboard) {

        existingDashboard.remove();

    }


    const dashboard =
        document.createElement("section");


    dashboard.id =
        "teacherDashboard";


    dashboard.innerHTML = `

        <div class="teacher-dashboard">

            <div class="dashboard-topbar">

                <div>

                    <h2>
                        Teacher Dashboard
                    </h2>

                    <p>
                        Welcome back,
                        <strong>
                            ${escapeHTML(
                                teacherProfile?.full_name ||
                                "Teacher"
                            )}
                        </strong>
                    </p>

                </div>


                <button
                    type="button"
                    class="secondary-btn"
                    onclick="logoutTeacher()"
                >
                    Logout
                </button>

            </div>


            <div class="dashboard-welcome">

                <span class="hero-badge">
                    CLASSMARK WORKSPACE
                </span>


                <h1>
                    ${escapeHTML(
                        teacherProfile?.school_name ||
                        "Your School"
                    )}
                </h1>


                <p>

                    Class:

                    <strong>
                        ${escapeHTML(
                            teacherProfile?.class_name ||
                            "-"
                        )}
                    </strong>

                    &nbsp; | &nbsp;

                    Session:

                    <strong>
                        ${escapeHTML(
                            teacherProfile?.session ||
                            "-"
                        )}
                    </strong>

                    &nbsp; | &nbsp;

                    Term:

                    <strong>
                        ${escapeHTML(
                            teacherProfile?.term ||
                            "-"
                        )}
                    </strong>

                </p>

            </div>


            <div class="dashboard-cards">


                <!-- STUDENTS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showStudents()"
                >

                    <span>
                        👨‍🎓
                    </span>

                    <h3>
                        Students
                    </h3>

                    <p>
                        Add and manage your students.
                    </p>

                </button>


                <!-- SUBJECTS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showSubjects()"
                >

                    <span>
                        📚
                    </span>

                    <h3>
                        Subjects
                    </h3>

                    <p>
                        Manage class subjects.
                    </p>

                </button>


                <!-- MARKS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showMarksComingSoon()"
                >

                    <span>
                        📝
                    </span>

                    <h3>
                        Marks
                    </h3>

                    <p>
                        Enter student assessments.
                    </p>

                </button>


                <!-- RESULTS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showResultsComingSoon()"
                >

                    <span>
                        📊
                    </span>

                    <h3>
                        Results
                    </h3>

                    <p>
                        Generate academic results.
                    </p>

                </button>


            </div>

        </div>

    `;


    const main =
        document.querySelector("main");


    if (main) {

        main.appendChild(dashboard);

    }


    addDashboardStyles();

}


// ==========================================
// COMING SOON ACTIONS
// ==========================================

function showMarksComingSoon() {

    alert(
        "Marks Management will be added soon."
    );

}


function showResultsComingSoon() {

    alert(
        "Results Management will be added soon."
    );

}


// ==========================================
// LOGOUT TEACHER
// ==========================================

async function logoutTeacher() {

    try {

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Unable to logout. Please try again."
            );

            return;

        }


        currentUser = null;

        teacherProfile = null;

        studentsCache = [];

        subjectsCache = [];

        editingStudentId = null;

        editingSubjectId = null;


        const dashboard =
            document.getElementById(
                "teacherDashboard"
            );


        if (dashboard) {

            dashboard.remove();

        }


        console.log(
            "Teacher logged out."
        );


    } catch (error) {

        console.error(
            "Unexpected logout error:",
            error
        );

    }

}


// ==========================================
// DASHBOARD STYLES
// ==========================================

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

        .teacher-dashboard {

            max-width: 1200px;

            margin: 0 auto;

            padding:
                50px 20px 80px;

        }


        .dashboard-topbar {

            display: flex;

            justify-content:
                space-between;

            align-items: center;

            gap: 20px;

            margin-bottom: 35px;

        }


        .dashboard-topbar h2 {

            margin:
                0 0 8px;

        }


        .dashboard-topbar p {

            margin: 0;

            opacity: 0.75;

        }


        .dashboard-welcome {

            padding: 35px;

            border-radius: 20px;

            margin-bottom: 30px;

            background:
                linear-gradient(
                    135deg,
                    #0b1220,
                    #111c32
                );

            border:
                1px solid
                rgba(
                    212,
                    175,
                    55,
                    0.25
                );

        }


        .dashboard-welcome h1 {

            margin:
                15px 0 10px;

        }


        .dashboard-welcome p {

            margin: 0;

            line-height: 1.7;

        }


        .dashboard-cards {

            display: grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap: 20px;

        }


        .dashboard-card {

            padding: 28px;

            border-radius: 18px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

            transition:
                transform 0.2s ease,
                border-color 0.2s ease,
                box-shadow 0.2s ease;

        }


        .dashboard-card:hover {

            transform:
                translateY(-4px);

            border-color:
                rgba(
                    212,
                    175,
                    55,
                    0.5
                );

            box-shadow:
                0 12px 30px
                rgba(
                    0,
                    0,
                    0,
                    0.18
                );

        }


        .dashboard-card-button {

            width: 100%;

            text-align: left;

            color: inherit;

            font: inherit;

            cursor: pointer;

            appearance: none;

        }


        .dashboard-card-button:focus-visible {

            outline:
                3px solid
                rgba(
                    212,
                    175,
                    55,
                    0.7
                );

            outline-offset: 3px;

        }


        .dashboard-card span {

            font-size: 28px;

        }


        .dashboard-card h3 {

            margin:
                16px 0 8px;

        }


        .dashboard-card p {

            margin: 0;

            opacity: 0.7;

            line-height: 1.6;

        }


        @media (max-width: 850px) {

            .dashboard-cards {

                grid-template-columns:
                    repeat(2, 1fr);

            }

        }


        @media (max-width: 560px) {

            .dashboard-topbar {

                align-items:
                    flex-start;

                flex-direction:
                    column;

            }


            .dashboard-welcome {

                padding:
                    25px;

            }


            .dashboard-cards {

                grid-template-columns:
                    1fr;

            }

        }

    `;


    document.head.appendChild(style);

}


// ==========================================
// STUDENTS MANAGEMENT
// ==========================================

async function showStudents() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) {

        return;

    }


    const existingStudents =
        document.getElementById(
            "studentsSection"
        );


    const existingSubjects =
        document.getElementById(
            "subjectsSection"
        );


    if (existingStudents) {

        existingStudents.remove();

    }


    if (existingSubjects) {

        existingSubjects.remove();

    }


    editingStudentId = null;


    const section =
        document.createElement("section");


    section.id =
        "studentsSection";


    section.className =
        "students-section";


    section.innerHTML = `

        <div class="students-header">

            <div>

                <span class="hero-badge">
                    STUDENT MANAGEMENT
                </span>


                <h2>
                    Students
                </h2>


                <p>
                    Add, search and manage your students.
                </p>

            </div>


            <button
                type="button"
                class="primary-btn"
                onclick="openStudentForm()"
            >
                + Add Student
            </button>

        </div>


        <div class="students-toolbar">

            <div class="student-count">

                <strong id="studentCount">
                    0
                </strong>

                <span>
                    Students
                </span>

            </div>


            <div class="student-search">

                <label
                    for="studentSearch"
                    class="sr-only"
                >
                    Search students
                </label>

                <input
                    type="search"
                    id="studentSearch"
                    placeholder="Search student name or admission number..."
                    oninput="filterStudents()"
                    autocomplete="off"
                >

            </div>

        </div>


        <div
            id="studentFormContainer"
            class="student-form-container"
            style="display:none;"
        >

            <div class="student-form-heading">

                <div>

                    <span class="hero-badge">
                        STUDENT RECORD
                    </span>

                    <h3 id="studentFormTitle">
                        Add Student
                    </h3>

                </div>

            </div>


            <form
                id="studentForm"
                onsubmit="saveStudent(event)"
            >

                <div class="form-grid">


                    <div>

                        <label for="studentName">
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="studentName"
                            placeholder="Enter student's full name"
                            required
                        >

                    </div>


                    <div>

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


                    <div>

                        <label for="studentDob">
                            Date of Birth
                        </label>

                        <input
                            type="date"
                            id="studentDob"
                        >

                    </div>


                    <div>

                        <label for="studentAdmission">
                            Admission Number
                        </label>

                        <input
                            type="text"
                            id="studentAdmission"
                            placeholder="e.g. CM/001"
                        >

                    </div>


                    <div>

                        <label for="studentClass">
                            Class
                        </label>

                        <input
                            type="text"
                            id="studentClass"
                            required
                        >

                    </div>


                    <div>

                        <label for="studentSession">
                            Academic Session
                        </label>

                        <input
                            type="text"
                            id="studentSession"
                            placeholder="e.g. 2026/2027"
                            required
                        >

                    </div>


                    <div>

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

                            <option value="First Term">
                                First Term
                            </option>

                            <option value="Second Term">
                                Second Term
                            </option>

                            <option value="Third Term">
                                Third Term
                            </option>

                        </select>

                    </div>


                </div>


                <div
                    id="studentFormError"
                    class="form-error"
                    role="alert"
                ></div>


                <div class="form-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        onclick="closeStudentForm()"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                        id="studentSubmitButton"
                    >
                        Save Student
                    </button>

                </div>

            </form>

        </div>


        <div
            id="studentsList"
            class="students-list"
        >

            <div class="students-loading">
                Loading students...
            </div>

        </div>

    `;


    dashboard.appendChild(section);


    addStudentsStyles();


    await loadStudents();

}


// ==========================================
// STUDENT FORM
// ==========================================

function openStudentForm(studentId = null) {

    const formContainer =
        document.getElementById(
            "studentFormContainer"
        );


    const form =
        document.getElementById(
            "studentForm"
        );


    if (!formContainer || !form) {

        return;

    }


    editingStudentId =
        studentId;


    form.reset();


    const title =
        document.getElementById(
            "studentFormTitle"
        );


    const submitButton =
        document.getElementById(
            "studentSubmitButton"
        );


    if (studentId) {

        const student =
            studentsCache.find(
                item =>
                    item.id === studentId
            );


        if (!student) {

            showStudentFormError(
                "Student record could not be found."
            );

            return;

        }


        document
            .getElementById("studentName")
            .value =
                student.full_name || "";


        document
            .getElementById("studentGender")
            .value =
                student.gender || "";


        document
            .getElementById("studentDob")
            .value =
                student.date_of_birth || "";


        document
            .getElementById("studentAdmission")
            .value =
                student.admission_number || "";


        document
            .getElementById("studentClass")
            .value =
                student.class_name || "";


        document
            .getElementById("studentSession")
            .value =
                student.session || "";


        document
            .getElementById("studentTerm")
            .value =
                student.term || "";


        if (title) {

            title.textContent =
                "Edit Student";

        }


        if (submitButton) {

            submitButton.textContent =
                "Update Student";

        }


    } else {

        document
            .getElementById("studentClass")
            .value =
                teacherProfile?.class_name || "";


        document
            .getElementById("studentSession")
            .value =
                teacherProfile?.session || "";


        document
            .getElementById("studentTerm")
            .value =
                teacherProfile?.term || "";


        if (title) {

            title.textContent =
                "Add Student";

        }


        if (submitButton) {

            submitButton.textContent =
                "Save Student";

        }

    }


    showStudentFormError("");


    formContainer.style.display =
        "block";


    formContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setTimeout(
        function () {

            document
                .getElementById("studentName")
                ?.focus();

        },
        200
    );

}


// ------------------------------------------
// CLOSE STUDENT FORM
// ------------------------------------------

function closeStudentForm() {

    const formContainer =
        document.getElementById(
            "studentFormContainer"
        );


    if (formContainer) {

        formContainer.style.display =
            "none";

    }


    editingStudentId = null;


    const form =
        document.getElementById(
            "studentForm"
        );


    if (form) {

        form.reset();

    }


    const title =
        document.getElementById(
            "studentFormTitle"
        );


    if (title) {

        title.textContent =
            "Add Student";

    }


    const submitButton =
        document.getElementById(
            "studentSubmitButton"
        );


    if (submitButton) {

        submitButton.textContent =
            "Save Student";

    }


    showStudentFormError("");

}


// ==========================================
// SAVE / UPDATE STUDENT
// ==========================================

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
            .getElementById("studentName")
            .value
            .trim();


    const gender =
        document
            .getElementById("studentGender")
            .value;


    const dateOfBirth =
        document
            .getElementById("studentDob")
            .value ||
        null;


    const admissionNumber =
        document
            .getElementById("studentAdmission")
            .value
            .trim() ||
        null;


    const className =
        document
            .getElementById("studentClass")
            .value
            .trim();


    const session =
        document
            .getElementById("studentSession")
            .value
            .trim();


    const term =
        document
            .getElementById("studentTerm")
            .value;


    if (!fullName) {

        showStudentFormError(
            "Please enter the student's name."
        );

        return;

    }


    if (!gender) {

        showStudentFormError(
            "Please select the student's gender."
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
            "Please select the term."
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "studentSubmitButton"
        );


    const wasEditing =
        Boolean(
            editingStudentId
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            wasEditing
                ? "Updating..."
                : "Saving...";

    }


    showStudentFormError("");


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


        let response;


        if (editingStudentId) {

            response =
                await supabaseClient
                    .from("students")
                    .update(
                        studentData
                    )
                    .eq(
                        "id",
                        editingStudentId
                    )
                    .eq(
                        "teacher_id",
                        currentUser.id
                    );

        } else {

            response =
                await supabaseClient
                    .from("students")
                    .insert([
                        studentData
                    ]);

        }


        const {
            error
        } = response;


        if (error) {

            console.error(
                "Student save/update error:",
                error
            );


            if (
                error.code === "23505"
            ) {

                showStudentFormError(
                    "This admission number is already assigned to another student."
                );

            } else {

                showStudentFormError(
                    "Unable to save the student. Please check the information and try again."
                );

            }


            return;

        }


        closeStudentForm();


        await loadStudents();


        console.log(
            wasEditing
                ? "Student updated successfully."
                : "Student added successfully."
        );


    } catch (error) {

        console.error(
            "Unexpected student save error:",
            error
        );


        showStudentFormError(
            "Something went wrong. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                wasEditing
                    ? "Update Student"
                    : "Save Student";

        }

    }

}


// ==========================================
// LOAD STUDENTS
// ==========================================

async function loadStudents() {

    const list =
        document.getElementById(
            "studentsList"
        );


    if (!list || !currentUser) {

        return;

    }


    list.innerHTML = `

        <div class="students-loading">
            Loading students...
        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("students")
                .select(`
                    id,
                    full_name,
                    gender,
                    date_of_birth,
                    admission_number,
                    class_name,
                    session,
                    term,
                    created_at
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "Student loading error:",
                error
            );


            list.innerHTML = `

                <div class="students-error">

                    <strong>
                        Unable to load students.
                    </strong>

                    <p>
                        Please refresh the section and try again.
                    </p>

                </div>

            `;

            return;

        }


        studentsCache =
            data || [];


        sortStudents(
            studentsCache
        );


        updateStudentCount(
            studentsCache.length
        );


        renderStudents(
            studentsCache
        );


    } catch (error) {

        console.error(
            "Unexpected student loading error:",
            error
        );


        list.innerHTML = `

            <div class="students-error">

                Unable to load students.
                Please try again.

            </div>

        `;

    }

}


// ==========================================
// SORT STUDENTS
// Male A-Z
// Female A-Z
// ==========================================

function sortStudents(students) {

    students.sort(
        function (a, b) {

            const genderOrder = {

                Male: 1,

                Female: 2

            };


            const genderA =
                genderOrder[
                    a.gender
                ] || 3;


            const genderB =
                genderOrder[
                    b.gender
                ] || 3;


            if (
                genderA !== genderB
            ) {

                return (
                    genderA -
                    genderB
                );

            }


            return String(
                a.full_name || ""
            ).localeCompare(
                String(
                    b.full_name || ""
                ),
                undefined,
                {
                    sensitivity:
                        "base"
                }
            );

        }
    );

}


// ==========================================
// UPDATE STUDENT COUNT
// ==========================================

function updateStudentCount(count) {

    const element =
        document.getElementById(
            "studentCount"
        );


    if (element) {

        element.textContent =
            count;

    }

}


// ==========================================
// FILTER / SEARCH STUDENTS
// ==========================================

function filterStudents() {

    const searchInput =
        document.getElementById(
            "studentSearch"
        );


    if (!searchInput) {

        return;

    }


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
            function (student) {

                const name =
                    String(
                        student.full_name || ""
                    ).toLowerCase();


                const admission =
                    String(
                        student.admission_number || ""
                    ).toLowerCase();


                const gender =
                    String(
                        student.gender || ""
                    ).toLowerCase();


                return (
                    name.includes(query) ||
                    admission.includes(query) ||
                    gender.includes(query)
                );

            }
        );


    renderStudents(
        filtered
    );

}


// ==========================================
// RENDER STUDENTS
// ==========================================

function renderStudents(students) {

    const list =
        document.getElementById(
            "studentsList"
        );


    if (!list) {

        return;

    }


    if (!students.length) {

        const hasSearch =
            Boolean(
                document
                    .getElementById(
                        "studentSearch"
                    )
                    ?.value
                    .trim()
            );


        list.innerHTML = `

            <div class="empty-students">

                <div class="empty-icon">
                    ${
                        hasSearch
                            ? "🔎"
                            : "👨‍🎓"
                    }
                </div>


                <h3>
                    ${
                        hasSearch
                            ? "No matching students"
                            : "No students yet"
                    }
                </h3>


                <p>
                    ${
                        hasSearch
                            ? "Try a different name, admission number or gender."
                            : "Add your first student to begin managing your class."
                    }
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = `

        <div class="students-table-wrapper">

            <table class="students-table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Student</th>

                        <th>Gender</th>

                        <th>Admission No.</th>

                        <th>Class</th>

                        <th>Session</th>

                        <th>Term</th>

                        <th>Actions</th>

                    </tr>

                </thead>


                <tbody>

                    ${students
                        .map(
                            function (
                                student,
                                index
                            ) {

                                return `

                                    <tr>

                                        <td>
                                            ${
                                                index + 1
                                            }
                                        </td>


                                        <td>

                                            <strong>
                                                ${escapeHTML(
                                                    student.full_name
                                                )}
                                            </strong>

                                        </td>


                                        <td>

                                            <span
                                                class="gender-badge ${
                                                    student.gender === "Male"
                                                        ? "gender-male"
                                                        : "gender-female"
                                                }"
                                            >
                                                ${escapeHTML(
                                                    student.gender
                                                )}
                                            </span>

                                        </td>


                                        <td>

                                            ${
                                                student.admission_number
                                                    ? escapeHTML(
                                                        student.admission_number
                                                    )
                                                    : "—"
                                            }

                                        </td>


                                        <td>
                                            ${escapeHTML(
                                                student.class_name
                                            )}
                                        </td>


                                        <td>
                                            ${escapeHTML(
                                                student.session
                                            )}
                                        </td>


                                        <td>
                                            ${escapeHTML(
                                                student.term
                                            )}
                                        </td>


                                        <td>

                                            <div class="student-actions">

                                                <button
                                                    type="button"
                                                    class="student-action edit-action"
                                                    onclick="openStudentForm('${escapeHTML(
                                                        student.id
                                                    )}')"
                                                >
                                                    Edit
                                                </button>


                                                <button
                                                    type="button"
                                                    class="student-action delete-action"
                                                    onclick="deleteStudent('${escapeHTML(
                                                        student.id
                                                    )}')"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                `;

                            }
                        )
                        .join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================
// DELETE STUDENT
// ==========================================

async function deleteStudent(studentId) {

    if (!currentUser) {

        alert(
            "You must be logged in."
        );

        return;

    }


    const student =
        studentsCache.find(
            function (item) {

                return item.id === studentId;

            }
        );


    if (!student) {

        alert(
            "Student record not found."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${student.full_name}"?\n\nThis action cannot be undone.`
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
                "Student delete error:",
                error
            );

            alert(
                "Unable to delete this student. Please try again."
            );

            return;

        }


        studentsCache =
            studentsCache.filter(
                function (item) {

                    return (
                        item.id !==
                        studentId
                    );

                }
            );


        updateStudentCount(
            studentsCache.length
        );


        filterStudents();


        console.log(
            "Student deleted successfully:",
            student.full_name
        );


    } catch (error) {

        console.error(
            "Unexpected student delete error:",
            error
        );

        alert(
            "Something went wrong while deleting the student."
        );

    }

}


// ==========================================
// STUDENT FORM ERROR
// ==========================================

function showStudentFormError(message) {

    const error =
        document.getElementById(
            "studentFormError"
        );


    if (error) {

        error.textContent =
            message;

    }

}


// ==========================================
// STUDENTS STYLES
// ==========================================

function addStudentsStyles() {

    if (
        document.getElementById(
            "classmarkStudentsStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "classmarkStudentsStyles";


    style.textContent = `

        .students-section {

            margin-top:
                35px;

            padding:
                30px;

            border-radius:
                20px;

            background:
                #0f172a;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .students-header {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap:
                20px;

            margin-bottom:
                25px;

        }


        .students-header h2 {

            margin:
                15px 0 8px;

        }


        .students-header p {

            margin:
                0;

            opacity:
                0.7;

        }


        .students-toolbar {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap:
                20px;

            margin-bottom:
                25px;

            padding:
                15px;

            border-radius:
                14px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.07
                );

        }


        .student-count {

            display:
                flex;

            align-items:
                baseline;

            gap:
                7px;

            white-space:
                nowrap;

        }


        .student-count strong {

            font-size:
                24px;

            color:
                #d4af37;

        }


        .student-count span {

            opacity:
                0.7;

            font-size:
                14px;

        }


        .student-search {

            flex:
                1;

            max-width:
                500px;

        }


        .student-search input {

            width:
                100%;

            box-sizing:
                border-box;

            padding:
                12px 15px;

            border-radius:
                10px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.12
                );

            background:
                #0b1220;

            color:
                #ffffff;

            font:
                inherit;

        }


        .student-search input:focus {

            outline:
                none;

            border-color:
                #d4af37;

            box-shadow:
                0 0 0 3px
                rgba(
                    212,
                    175,
                    55,
                    0.12
                );

        }


        .student-form-container {

            margin-bottom:
                30px;

            padding:
                25px;

            border-radius:
                18px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    212,
                    175,
                    55,
                    0.2
                );

        }


        .student-form-heading {

            margin-bottom:
                25px;

        }


        .student-form-heading h3 {

            margin:
                12px 0 0;

        }


        .form-grid {

            display:
                grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap:
                20px;

        }


        .form-grid > div {

            display:
                flex;

            flex-direction:
                column;

            gap:
                8px;

        }


        .form-grid label {

            font-weight:
                600;

        }


        .form-grid input,
        .form-grid select {

            width:
                100%;

            padding:
                13px 14px;

            border-radius:
                10px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.12
                );

            background:
                #0b1220;

            color:
                #ffffff;

            font:
                inherit;

            box-sizing:
                border-box;

        }


        .form-grid input:focus,
        .form-grid select:focus {

            outline:
                none;

            border-color:
                #d4af37;

            box-shadow:
                0 0 0 3px
                rgba(
                    212,
                    175,
                    55,
                    0.12
                );

        }


        .form-actions {

            display:
                flex;

            justify-content:
                flex-end;

            gap:
                12px;

            margin-top:
                25px;

        }


        .form-error {

            margin-top:
                15px;

            color:
                #ff8a8a;

            font-size:
                14px;

        }


        .students-list {

            width:
                100%;

        }


        .students-loading {

            padding:
                30px;

            text-align:
                center;

            opacity:
                0.7;

        }


        .students-error {

            padding:
                25px;

            text-align:
                center;

            border-radius:
                14px;

            background:
                rgba(
                    255,
                    90,
                    90,
                    0.08
                );

            border:
                1px solid
                rgba(
                    255,
                    90,
                    90,
                    0.2
                );

            color:
                #ffb0b0;

        }


        .students-error p {

            margin:
                8px 0 0;

            opacity:
                0.8;

        }


        .empty-students {

            padding:
                50px 20px;

            text-align:
                center;

            border-radius:
                16px;

            background:
                #111827;

            border:
                1px dashed
                rgba(
                    255,
                    255,
                    255,
                    0.15
                );

        }


        .empty-icon {

            font-size:
                42px;

            margin-bottom:
                12px;

        }


        .empty-students h3 {

            margin:
                0 0 8px;

        }


        .empty-students p {

            margin:
                0;

            opacity:
                0.65;

        }


        .students-table-wrapper {

            width:
                100%;

            overflow-x:
                auto;

            border-radius:
                16px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .students-table {

            width:
                100%;

            min-width:
                950px;

            border-collapse:
                collapse;

            background:
                #111827;

        }


        .students-table th {

            padding:
                15px;

            text-align:
                left;

            background:
                #0b1220;

            color:
                #d4af37;

            font-size:
                13px;

            text-transform:
                uppercase;

            letter-spacing:
                0.04em;

        }


        .students-table td {

            padding:
                15px;

            border-top:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.06
                );

            white-space:
                nowrap;

        }


        .students-table tbody tr:hover {

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.025
                );

        }


        .gender-badge {

            display:
                inline-flex;

            align-items:
                center;

            padding:
                5px 9px;

            border-radius:
                999px;

            font-size:
                12px;

            font-weight:
                700;

        }


        .gender-male {

            background:
                rgba(
                    59,
                    130,
                    246,
                    0.12
                );

            color:
                #93c5fd;

        }


        .gender-female {

            background:
                rgba(
                    236,
                    72,
                    153,
                    0.12
                );

            color:
                #f9a8d4;

        }


        .student-actions {

            display:
                flex;

            align-items:
                center;

            gap:
                8px;

        }


        .student-action {

            border:
                0;

            border-radius:
                8px;

            padding:
                8px 11px;

            font:
                inherit;

            font-size:
                12px;

            font-weight:
                700;

            cursor:
                pointer;

        }


        .edit-action {

            background:
                rgba(
                    212,
                    175,
                    55,
                    0.12
                );

            color:
                #e6c95c;

        }


        .edit-action:hover {

            background:
                rgba(
                    212,
                    175,
                    55,
                    0.22
                );

        }


        .delete-action {

            background:
                rgba(
                    239,
                    68,
                    68,
                    0.1
                );

            color:
                #fca5a5;

        }


        .delete-action:hover {

            background:
                rgba(
                    239,
                    68,
                    68,
                    0.2
                );

        }


        .student-action:focus-visible {

            outline:
                2px solid
                #d4af37;

            outline-offset:
                2px;

        }


        .sr-only {

            position:
                absolute;

            width:
                1px;

            height:
                1px;

            padding:
                0;

            margin:
                -1px;

            overflow:
                hidden;

            clip:
                rect(
                    0,
                    0,
                    0,
                    0
                );

            white-space:
                nowrap;

            border:
                0;

        }


        @media (max-width: 700px) {

            .students-section {

                padding:
                    20px;

            }


            .students-header {

                align-items:
                    flex-start;

                flex-direction:
                    column;

            }


            .students-header .primary-btn {

                width:
                    100%;

            }


            .students-toolbar {

                align-items:
                    stretch;

                flex-direction:
                    column;

            }


            .student-search {

                max-width:
                    none;

            }


            .form-grid {

                grid-template-columns:
                    1fr;

            }


            .form-actions {

                flex-direction:
                    column;

            }


            .form-actions button {

                width:
                    100%;

            }

        }

    `;


    document.head.appendChild(style);

}


// ==========================================
// SUBJECTS MANAGEMENT
// ==========================================

async function showSubjects() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) {

        return;

    }


    const existingStudents =
        document.getElementById(
            "studentsSection"
        );


    const existingSubjects =
        document.getElementById(
            "subjectsSection"
        );


    if (existingStudents) {

        existingStudents.remove();

    }


    if (existingSubjects) {

        existingSubjects.remove();

    }


    editingSubjectId = null;


    const section =
        document.createElement("section");


    section.id =
        "subjectsSection";


    section.className =
        "subjects-section";


    section.innerHTML = `

        <div class="subjects-header">

            <div>

                <span class="hero-badge">
                    SUBJECT MANAGEMENT
                </span>


                <h2>
                    Subjects
                </h2>


                <p>
                    Add, search and manage subjects for your class.
                </p>

            </div>


            <button
                type="button"
                class="primary-btn"
                onclick="openSubjectForm()"
            >
                + Add Subject
            </button>

        </div>


        <div class="subjects-toolbar">

            <div class="subject-count">

                <strong id="subjectCount">
                    0
                </strong>

                <span>
                    Subjects
                </span>

            </div>


            <div class="subject-search">

                <label
                    for="subjectSearch"
                    class="sr-only"
                >
                    Search subjects
                </label>

                <input
                    type="search"
                    id="subjectSearch"
                    placeholder="Search subject, code or class..."
                    oninput="filterSubjects()"
                    autocomplete="off"
                >

            </div>

        </div>


        <div
            id="subjectFormContainer"
            class="subject-form-container"
            style="display:none;"
        >

            <div class="subject-form-heading">

                <span class="hero-badge">
                    SUBJECT RECORD
                </span>


                <h3 id="subjectFormTitle">
                    Add Subject
                </h3>

            </div>


            <form
                id="subjectForm"
                onsubmit="saveSubject(event)"
            >

                <div class="form-grid">


                    <div>

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


                    <div>

                        <label for="subjectCode">
                            Subject Code
                        </label>

                        <input
                            type="text"
                            id="subjectCode"
                            placeholder="e.g. MTH101"
                        >

                    </div>


                    <div>

                        <label for="subjectClass">
                            Class
                        </label>

                        <input
                            type="text"
                            id="subjectClass"
                            placeholder="e.g. JSS2A"
                            required
                        >

                    </div>


                    <div>

                        <label for="subjectSession">
                            Academic Session
                        </label>

                        <input
                            type="text"
                            id="subjectSession"
                            placeholder="e.g. 2026/2027"
                            required
                        >

                    </div>


                    <div>

                        <label for="subjectTerm">
                            Term
                        </label>

                        <select
                            id="subjectTerm"
                            required
                        >

                            <option value="">
                                Select term
                            </option>

                            <option value="First Term">
                                First Term
                            </option>

                            <option value="Second Term">
                                Second Term
                            </option>

                            <option value="Third Term">
                                Third Term
                            </option>

                        </select>

                    </div>


                </div>


                <div
                    id="subjectFormError"
                    class="form-error"
                    role="alert"
                ></div>


                <div class="form-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        onclick="closeSubjectForm()"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                        id="subjectSubmitButton"
                    >
                        Save Subject
                    </button>

                </div>

            </form>

        </div>


        <div
            id="subjectsList"
            class="subjects-list"
        >

            <div class="subjects-loading">
                Loading subjects...
            </div>

        </div>

    `;


    dashboard.appendChild(section);


    addSubjectsStyles();


    await loadSubjects();

}


// ==========================================
// SUBJECT FORM
// ==========================================

function openSubjectForm(subjectId = null) {

    const formContainer =
        document.getElementById(
            "subjectFormContainer"
        );


    const form =
        document.getElementById(
            "subjectForm"
        );


    if (!formContainer || !form) {

        return;

    }


    editingSubjectId =
        subjectId;


    form.reset();


    const title =
        document.getElementById(
            "subjectFormTitle"
        );


    const submitButton =
        document.getElementById(
            "subjectSubmitButton"
        );


    if (subjectId) {

        const subject =
            subjectsCache.find(
                item =>
                    item.id === subjectId
            );


        if (!subject) {

            showSubjectFormError(
                "Subject record could not be found."
            );

            return;

        }


        document
            .getElementById("subjectName")
            .value =
                subject.subject_name || "";


        document
            .getElementById("subjectCode")
            .value =
                subject.subject_code || "";


        document
            .getElementById("subjectClass")
            .value =
                subject.class_name || "";


        document
            .getElementById("subjectSession")
            .value =
                subject.session || "";


        document
            .getElementById("subjectTerm")
            .value =
                subject.term || "";


        if (title) {

            title.textContent =
                "Edit Subject";

        }


        if (submitButton) {

            submitButton.textContent =
                "Update Subject";

        }


    } else {

        document
            .getElementById("subjectClass")
            .value =
                teacherProfile?.class_name || "";


        document
            .getElementById("subjectSession")
            .value =
                teacherProfile?.session || "";


        document
            .getElementById("subjectTerm")
            .value =
                teacherProfile?.term || "";


        if (title) {

            title.textContent =
                "Add Subject";

        }


        if (submitButton) {

            submitButton.textContent =
                "Save Subject";

        }

    }


    showSubjectFormError("");


    formContainer.style.display =
        "block";


    formContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setTimeout(
        function () {

            document
                .getElementById("subjectName")
                ?.focus();

        },
        200
    );

}


// ==========================================
// CLOSE SUBJECT FORM
// ==========================================

function closeSubjectForm() {

    const formContainer =
        document.getElementById(
            "subjectFormContainer"
        );


    if (formContainer) {

        formContainer.style.display =
            "none";

    }


    editingSubjectId = null;


    const form =
        document.getElementById(
            "subjectForm"
        );


    if (form) {

        form.reset();

    }


    const title =
        document.getElementById(
            "subjectFormTitle"
        );


    if (title) {

        title.textContent =
            "Add Subject";

    }


    const submitButton =
        document.getElementById(
            "subjectSubmitButton"
        );


    if (submitButton) {

        submitButton.textContent =
            "Save Subject";

    }


    showSubjectFormError("");

}


// ==========================================
// SAVE / UPDATE SUBJECT
// ==========================================

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
            .getElementById("subjectName")
            .value
            .trim();


    const subjectCode =
        document
            .getElementById("subjectCode")
            .value
            .trim() ||
        null;


    const className =
        document
            .getElementById("subjectClass")
            .value
            .trim();


    const session =
        document
            .getElementById("subjectSession")
            .value
            .trim();


    const term =
        document
            .getElementById("subjectTerm")
            .value;


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
            "Please select the term."
        );

        return;

    }


    const duplicate =
        subjectsCache.find(
            function (subject) {

                const sameName =
                    String(
                        subject.subject_name || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    subjectName
                        .toLowerCase();


                const sameClass =
                    String(
                        subject.class_name || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    className
                        .toLowerCase();


                const sameSession =
                    String(
                        subject.session || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    session
                        .toLowerCase();


                const sameTerm =
                    String(
                        subject.term || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    term
                        .toLowerCase();


                const differentRecord =
                    subject.id !==
                    editingSubjectId;


                return (
                    sameName &&
                    sameClass &&
                    sameSession &&
                    sameTerm &&
                    differentRecord
                );

            }
        );


    if (duplicate) {

        showSubjectFormError(
            "This subject already exists for this class, session and term."
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "subjectSubmitButton"
        );


    const wasEditing =
        Boolean(
            editingSubjectId
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            wasEditing
                ? "Updating..."
                : "Saving...";

    }


    showSubjectFormError("");


    try {

        const subjectData = {

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

        };


        let response;


        if (editingSubjectId) {

            response =
                await supabaseClient
                    .from("subjects")
                    .update(
                        subjectData
                    )
                    .eq(
                        "id",
                        editingSubjectId
                    )
                    .eq(
                        "teacher_id",
                        currentUser.id
                    );

        } else {

            response =
                await supabaseClient
                    .from("subjects")
                    .insert([
                        subjectData
                    ]);

        }


        const {
            error
        } = response;


        if (error) {

            console.error(
                "Subject save/update error:",
                error
            );


            if (
                error.code === "23505"
            ) {

                showSubjectFormError(
                    "This subject already exists for this class, session and term."
                );

            } else {

                showSubjectFormError(
                    "Unable to save the subject. Please check the information and try again."
                );

            }


            return;

        }


        closeSubjectForm();


        await loadSubjects();


        console.log(
            wasEditing
                ? "Subject updated successfully."
                : "Subject added successfully."
        );


    } catch (error) {

        console.error(
            "Unexpected subject save error:",
            error
        );


        showSubjectFormError(
            "Something went wrong. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                wasEditing
                    ? "Update Subject"
                    : "Save Subject";

        }

    }

}


// ==========================================
// LOAD SUBJECTS
// ==========================================

async function loadSubjects() {

    const list =
        document.getElementById(
            "subjectsList"
        );


    if (!list || !currentUser) {

        return;

    }


    list.innerHTML = `

        <div class="subjects-loading">
            Loading subjects...
        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("subjects")
                .select(`
                    id,
                    subject_name,
                    subject_code,
                    class_name,
                    session,
                    term,
                    created_at
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .order(
                    "subject_name",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "Subject loading error:",
                error
            );


            list.innerHTML = `

                <div class="subjects-error">

                    <strong>
                        Unable to load subjects.
                    </strong>

                    <p>
                        Please try again.
                    </p>

                </div>

            `;

            return;

        }


        subjectsCache =
            data || [];


        subjectsCache.sort(
            function (a, b) {

                return String(
                    a.subject_name || ""
                ).localeCompare(
                    String(
                        b.subject_name || ""
                    ),
                    undefined,
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        updateSubjectCount(
            subjectsCache.length
        );


        renderSubjects(
            subjectsCache
        );


    } catch (error) {

        console.error(
            "Unexpected subject loading error:",
            error
        );


        list.innerHTML = `

            <div class="subjects-error">

                Unable to load subjects.
                Please try again.

            </div>

        `;

    }

}


// ==========================================
// FILTER SUBJECTS
// ==========================================

function filterSubjects() {

    const searchInput =
        document.getElementById(
            "subjectSearch"
        );


    if (!searchInput) {

        return;

    }


    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {

        renderSubjects(
            subjectsCache
        );

        return;

    }


    const filtered =
        subjectsCache.filter(
            function (subject) {

                const name =
                    String(
                        subject.subject_name || ""
                    )
                    .toLowerCase();


                const code =
                    String(
                        subject.subject_code || ""
                    )
                    .toLowerCase();


                const className =
                    String(
                        subject.class_name || ""
                    )
                    .toLowerCase();


                const session =
                    String(
                        subject.session || ""
                    )
                    .toLowerCase();


                const term =
                    String(
                        subject.term || ""
                    )
                    .toLowerCase();


                return (
                    name.includes(query) ||
                    code.includes(query) ||
                    className.includes(query) ||
                    session.includes(query) ||
                    term.includes(query)
                );

            }
        );


    renderSubjects(
        filtered
    );

}


// ==========================================
// RENDER SUBJECTS
// ==========================================

function renderSubjects(subjects) {

    const list =
        document.getElementById(
            "subjectsList"
        );


    if (!list) {

        return;

    }


    if (!subjects.length) {

        const hasSearch =
            Boolean(
                document
                    .getElementById(
                        "subjectSearch"
                    )
                    ?.value
                    .trim()
            );


        list.innerHTML = `

            <div class="empty-subjects">

                <div class="empty-icon">

                    ${
                        hasSearch
                            ? "🔎"
                            : "📚"
                    }

                </div>


                <h3>

                    ${
                        hasSearch
                            ? "No matching subjects"
                            : "No subjects yet"
                    }

                </h3>


                <p>

                    ${
                        hasSearch
                            ? "Try another subject name, code or class."
                            : "Add your first subject to begin."
                    }

                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = `

        <div class="subjects-table-wrapper">

            <table class="subjects-table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Subject</th>

                        <th>Code</th>

                        <th>Class</th>

                        <th>Session</th>

                        <th>Term</th>

                        <th>Actions</th>

                    </tr>

                </thead>


                <tbody>

                    ${subjects
                        .map(
                            function (
                                subject,
                                index
                            ) {

                                return `

                                    <tr>

                                        <td>
                                            ${
                                                index + 1
                                            }
                                        </td>


                                        <td>

                                            <strong>
                                                ${escapeHTML(
                                                    subject.subject_name
                                                )}
                                            </strong>

                                        </td>


                                        <td>

                                            ${
                                                subject.subject_code
                                                    ? escapeHTML(
                                                        subject.subject_code
                                                    )
                                                    : "—"
                                            }

                                        </td>


                                        <td>
                                            ${escapeHTML(
                                                subject.class_name
                                            )}
                                        </td>


                                        <td>
                                            ${escapeHTML(
                                                subject.session
                                            )}
                                        </td>


                                        <td>
                                            ${escapeHTML(
                                                subject.term
                                            )}
                                        </td>


                                        <td>

                                            <div class="subject-actions">

                                                <button
                                                    type="button"
                                                    class="subject-action edit-action"
                                                    onclick="openSubjectForm('${escapeHTML(
                                                        subject.id
                                                    )}')"
                                                >
                                                    Edit
                                                </button>


                                                <button
                                                    type="button"
                                                    class="subject-action delete-action"
                                                    onclick="deleteSubject('${escapeHTML(
                                                        subject.id
                                                    )}')"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                `;

                            }
                        )
                        .join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================
// DELETE SUBJECT
// ==========================================

async function deleteSubject(subjectId) {

    if (!currentUser) {

        alert(
            "You must be logged in."
        );

        return;

    }


    const subject =
        subjectsCache.find(
            function (item) {

                return item.id === subjectId;

            }
        );


    if (!subject) {

        alert(
            "Subject record not found."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${subject.subject_name}"?\n\nThis action cannot be undone.`
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
                "Subject delete error:",
                error
            );


            alert(
                "Unable to delete this subject. Please try again."
            );

            return;

        }


        subjectsCache =
            subjectsCache.filter(
                function (item) {

                    return (
                        item.id !==
                        subjectId
                    );

                }
            );


        updateSubjectCount(
            subjectsCache.length
        );


        filterSubjects();


        console.log(
            "Subject deleted successfully:",
            subject.subject_name
        );


    } catch (error) {

        console.error(
            "Unexpected subject delete error:",
            error
        );


        alert(
            "Something went wrong while deleting the subject."
        );

    }

}


// ==========================================
// UPDATE SUBJECT COUNT
// ==========================================

function updateSubjectCount(count) {

    const element =
        document.getElementById(
            "subjectCount"
        );


    if (element) {

        element.textContent =
            count;

    }

}


// ==========================================
// SUBJECT FORM ERROR
// ==========================================

function showSubjectFormError(message) {

    const error =
        document.getElementById(
            "subjectFormError"
        );


    if (error) {

        error.textContent =
            message;

    }

}


// ==========================================
// SUBJECTS STYLES
// ==========================================

function addSubjectsStyles() {

    if (
        document.getElementById(
            "classmarkSubjectsStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "classmarkSubjectsStyles";


    style.textContent = `

        .subjects-section {

            margin-top:
                35px;

            padding:
                30px;

            border-radius:
                20px;

            background:
                #0f172a;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .subjects-header {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap:
                20px;

            margin-bottom:
                25px;

        }


        .subjects-header h2 {

            margin:
                15px 0 8px;

        }


        .subjects-header p {

            margin:
                0;

            opacity:
                0.7;

        }


        .subjects-toolbar {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap:
                20px;

            margin-bottom:
                25px;

            padding:
                15px;

            border-radius:
                14px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.07
                );

        }


        .subject-count {

            display:
                flex;

            align-items:
                baseline;

            gap:
                7px;

            white-space:
                nowrap;

        }


        .subject-count strong {

            font-size:
                24px;

            color:
                #d4af37;

        }


        .subject-count span {

            opacity:
                0.7;

            font-size:
                14px;

        }


        .subject-search {

            flex:
                1;

            max-width:
                500px;

        }


        .subject-search input {

            width:
                100%;

            box-sizing:
                border-box;

            padding:
                12px 15px;

            border-radius:
                10px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.12
                );

            background:
                #0b1220;

            color:
                #ffffff;

            font:
                inherit;

        }


        .subject-search input:focus {

            outline:
                none;

            border-color:
                #d4af37;

            box-shadow:
                0 0 0 3px
                rgba(
                    212,
                    175,
                    55,
                    0.12
                );

        }


        .subject-form-container {

            margin-bottom:
                30px;

            padding:
                25px;

            border-radius:
                18px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    212,
                    175,
                    55,
                    0.2
                );

        }


        .subject-form-heading {

            margin-bottom:
                25px;

        }


        .subject-form-heading h3 {

            margin:
                12px 0 0;

        }


        .subjects-list {

            width:
                100%;

        }


        .subjects-loading {

            padding:
                30px;

            text-align:
                center;

            opacity:
                0.7;

        }


        .subjects-error {

            padding:
                25px;

            text-align:
                center;

            border-radius:
                14px;

            background:
                rgba(
                    255,
                    90,
                    90,
                    0.08
                );

            border:
                1px solid
                rgba(
                    255,
                    90,
                    90,
                    0.2
                );

            color:
                #ffb0b0;

        }


        .subjects-error p {

            margin:
                8px 0 0;

            opacity:
                0.8;

        }


        .empty-subjects {

            padding:
                50px 20px;

            text-align:
                center;

            border-radius:
                16px;

            background:
                #111827;

            border:
                1px dashed
                rgba(
                    255,
                    255,
                    255,
                    0.15
                );

        }


        .subjects-table-wrapper {

            width:
                100%;

            overflow-x:
                auto;

            border-radius:
                16px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .subjects-table {

            width:
                100%;

            min-width:
                850px;

            border-collapse:
                collapse;

            background:
                #111827;

        }


        .subjects-table th {

            padding:
                15px;

            text-align:
                left;

            background:
                #0b1220;

            color:
                #d4af37;

            font-size:
                13px;

            text-transform:
                uppercase;

            letter-spacing:
                0.04em;

        }


        .subjects-table td {

            padding:
                15px;

            border-top:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.06
                );

            white-space:
                nowrap;

        }


        .subjects-table tbody tr:hover {

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.025
                );

        }


        .subject-actions {

            display:
                flex;

            align-items:
                center;

            gap:
                8px;

        }


        .subject-action {

            border:
                0;

            border-radius:
                8px;

            padding:
                8px 11px;

            font:
                inherit;

            font-size:
                12px;

            font-weight:
                700;

            cursor:
                pointer;

        }


        @media (max-width: 700px) {

            .subjects-section {

                padding:
                    20px;

            }


            .subjects-header {

                align-items:
                    flex-start;

                flex-direction:
                    column;

            }


            .subjects-header .primary-btn {

                width:
                    100%;

            }


            .subjects-toolbar {

                align-items:
                    stretch;

                flex-direction:
                    column;

            }


            .subject-search {

                max-width:
                    none;

            }

        }

    `;


    document.head.appendChild(style);

}


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")

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