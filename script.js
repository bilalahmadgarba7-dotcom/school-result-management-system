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
    "sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m";


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
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                currentUser =
                    session.user;

            } else {

                currentUser = null;
                teacherProfile = null;

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
                    <h2>Teacher Dashboard</h2>

                    <p>
                        Welcome back,
                        <strong>
                            ${teacherProfile?.full_name || "Teacher"}
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
                    ${teacherProfile?.school_name || "Your School"}
                </h1>

                <p>
                    Class:
                    <strong>
                        ${teacherProfile?.class_name || "-"}
                    </strong>

                    &nbsp; | &nbsp;

                    Session:
                    <strong>
                        ${teacherProfile?.session || "-"}
                    </strong>

                    &nbsp; | &nbsp;

                    Term:
                    <strong>
                        ${teacherProfile?.term || "-"}
                    </strong>
                </p>

            </div>


            <div class="dashboard-cards">

                <div class="dashboard-card">
                    <span>👨‍🎓</span>
                    <h3>Students</h3>
                    <p>Manage your students.</p>
                </div>


                <div class="dashboard-card">
                    <span>📚</span>
                    <h3>Subjects</h3>
                    <p>Manage class subjects.</p>
                </div>


                <div class="dashboard-card">
                    <span>📝</span>
                    <h3>Marks</h3>
                    <p>Enter student assessments.</p>
                </div>


                <div class="dashboard-card">
                    <span>📊</span>
                    <h3>Results</h3>
                    <p>Generate academic results.</p>
                </div>

            </div>

        </div>

    `;


    document
        .querySelector("main")
        .appendChild(dashboard);


    addDashboardStyles();

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
            padding: 50px 20px 80px;
        }


        .dashboard-topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-bottom: 35px;
        }


        .dashboard-topbar h2 {
            margin: 0 0 8px;
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
            border: 1px solid rgba(
                212,
                175,
                55,
                0.25
            );
        }


        .dashboard-welcome h1 {
            margin: 15px 0 10px;
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
            background: #111827;
            border: 1px solid rgba(
                255,
                255,
                255,
                0.08
            );
            transition:
                transform 0.2s ease,
                border-color 0.2s ease;
        }


        .dashboard-card:hover {
            transform: translateY(-4px);
            border-color:
                rgba(212, 175, 55, 0.5);
        }


        .dashboard-card span {
            font-size: 28px;
        }


        .dashboard-card h3 {
            margin: 16px 0 8px;
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
                align-items: flex-start;
                flex-direction: column;
            }


            .dashboard-welcome {
                padding: 25px;
            }


            .dashboard-cards {
                grid-template-columns: 1fr;
            }

        }

    `;


    document.head.appendChild(style);

}
    