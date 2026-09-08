/* =========================================================
   MIR.PY — COMPLETE SCRIPT
   Shahmir Baloch Portfolio
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/* =========================================================
   LOADER / ROBOT SYSTEM
   ========================================================= */

const loader = $("#loader");
const robot = $("#robot");
const robotImage = $("#robotImage");
const runButton = $("#runButton");
const debugMessage = $("#debugMessage");
const debugBar = $("#debugBar");
const debugProgress = $("#debugProgress");
const loaderStatus = $("#loaderStatus");

let loaderFinished = false;
let debugStarted = false;

let robotX = 0;
let robotY = 0;

let robotTargetX = 0;
let robotTargetY = 0;

let robotVelocityX = 0;
let robotVelocityY = 0;

let lastFrameTime = performance.now();


/* ---------------------------------------------------------
   Remove near-white background from robot image
   --------------------------------------------------------- */

function removeWhiteBackground(image) {

    if (!image || !robot) return;

    try {

        const canvas =
            document.createElement("canvas");

        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );

        if (!ctx) return;

        canvas.width =
            image.naturalWidth;

        canvas.height =
            image.naturalHeight;

        if (
            !canvas.width ||
            !canvas.height
        ) {
            return;
        }

        ctx.drawImage(
            image,
            0,
            0
        );

        const imageData =
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );

        const data =
            imageData.data;

        const width =
            canvas.width;

        const height =
            canvas.height;

        const visited =
            new Uint8Array(
                width * height
            );

        const queue = [];


        function isWhite(index) {

            const r =
                data[index];

            const g =
                data[index + 1];

            const b =
                data[index + 2];

            const a =
                data[index + 3];

            return (
                a > 0 &&
                r > 225 &&
                g > 225 &&
                b > 225
            );
        }


        function addPixel(x, y) {

            if (
                x < 0 ||
                y < 0 ||
                x >= width ||
                y >= height
            ) {
                return;
            }

            const position =
                y * width + x;

            if (visited[position]) {
                return;
            }

            visited[position] = 1;

            const index =
                position * 4;

            if (isWhite(index)) {
                queue.push(position);
            }
        }


        /* Start from all edges */

        for (
            let x = 0;
            x < width;
            x++
        ) {

            addPixel(x, 0);

            addPixel(
                x,
                height - 1
            );
        }


        for (
            let y = 0;
            y < height;
            y++
        ) {

            addPixel(0, y);

            addPixel(
                width - 1,
                y
            );
        }


        let pointer = 0;


        while (
            pointer <
            queue.length
        ) {

            const position =
                queue[pointer++];

            const x =
                position % width;

            const y =
                Math.floor(
                    position / width
                );

            const index =
                position * 4;

            data[index + 3] = 0;

            addPixel(
                x + 1,
                y
            );

            addPixel(
                x - 1,
                y
            );

            addPixel(
                x,
                y + 1
            );

            addPixel(
                x,
                y - 1
            );
        }


        ctx.putImageData(
            imageData,
            0,
            0
        );

        robotImage.src =
            canvas.toDataURL(
                "image/png"
            );

    } catch (error) {

        console.warn(
            "Robot background processing failed:",
            error
        );
    }
}


/* ---------------------------------------------------------
   Robot initial position
   --------------------------------------------------------- */

function randomRobotPosition() {

    if (!robot || !loader) {
        return;
    }

    const robotWidth =
        robot.offsetWidth || 120;

    const robotHeight =
        robot.offsetHeight || 120;

    const padding = 30;

    const maxX =
        Math.max(
            padding,
            window.innerWidth -
            robotWidth -
            padding
        );

    const maxY =
        Math.max(
            padding,
            window.innerHeight -
            robotHeight -
            padding
        );

    robotX =
        padding +
        Math.random() *
        (maxX - padding);

    robotY =
        padding +
        Math.random() *
        (maxY - padding);

    robotTargetX =
        padding +
        Math.random() *
        (maxX - padding);

    robotTargetY =
        padding +
        Math.random() *
        (maxY - padding);

    robotVelocityX = 0;
    robotVelocityY = 0;

    updateRobotPosition();
}


/* ---------------------------------------------------------
   Keep robot inside viewport
   --------------------------------------------------------- */

function clampRobotPosition() {

    if (!robot) return;

    const width =
        robot.offsetWidth || 120;

    const height =
        robot.offsetHeight || 120;

    const maxX =
        Math.max(
            0,
            window.innerWidth - width
        );

    const maxY =
        Math.max(
            0,
            window.innerHeight - height
        );

    robotX =
        Math.max(
            0,
            Math.min(
                robotX,
                maxX
            )
        );

    robotY =
        Math.max(
            0,
            Math.min(
                robotY,
                maxY
            )
        );
}


/* ---------------------------------------------------------
   Apply robot transform
   --------------------------------------------------------- */

function updateRobotPosition() {

    if (!robot) return;

    robot.style.transform =
        `translate3d(${robotX}px, ${robotY}px, 0)`;
}


/* ---------------------------------------------------------
   Choose a new random roaming target
   --------------------------------------------------------- */

function chooseRoamingTarget() {

    if (!robot) return;

    const width =
        robot.offsetWidth || 120;

    const height =
        robot.offsetHeight || 120;

    const padding = 20;

    const maxX =
        Math.max(
            padding,
            window.innerWidth -
            width -
            padding
        );

    const maxY =
        Math.max(
            padding,
            window.innerHeight -
            height -
            padding
        );

    robotTargetX =
        padding +
        Math.random() *
        Math.max(
            1,
            maxX - padding
        );

    robotTargetY =
        padding +
        Math.random() *
        Math.max(
            1,
            maxY - padding
        );
}


/* ---------------------------------------------------------
   Smooth robot movement
   --------------------------------------------------------- */

function animateRobot(currentTime) {

    const delta =
        Math.min(
            32,
            currentTime -
            lastFrameTime
        ) / 16.67;

    lastFrameTime =
        currentTime;


    if (
        !debugStarted &&
        !loaderFinished &&
        robot
    ) {

        const dx =
            robotTargetX -
            robotX;

        const dy =
            robotTargetY -
            robotY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance < 20) {

            chooseRoamingTarget();

        } else {

            const directionX =
                dx / distance;

            const directionY =
                dy / distance;

            const speed =
                1.5 * delta;


            robotVelocityX +=
                (
                    directionX * speed -
                    robotVelocityX
                ) * 0.08;

            robotVelocityY +=
                (
                    directionY * speed -
                    robotVelocityY
                ) * 0.08;


            robotX +=
                robotVelocityX;

            robotY +=
                robotVelocityY;


            clampRobotPosition();

            updateRobotPosition();
        }
    }


    requestAnimationFrame(
        animateRobot
    );
}


/* ---------------------------------------------------------
   Move robot toward Run button
   --------------------------------------------------------- */

async function chaseRunButton() {

    if (!robot || !runButton) {
        return;
    }


    const buttonRect =
        runButton.getBoundingClientRect();

    const robotWidth =
        robot.offsetWidth || 120;

    const robotHeight =
        robot.offsetHeight || 120;


    const targetX =
        buttonRect.left +
        buttonRect.width / 2 -
        robotWidth / 2;

    const targetY =
        buttonRect.top +
        buttonRect.height / 2 -
        robotHeight / 2;


    robotTargetX =
        targetX;

    robotTargetY =
        targetY;


    while (true) {

        const dx =
            robotTargetX -
            robotX;

        const dy =
            robotTargetY -
            robotY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance < 5) {
            break;
        }


        const speed =
            Math.min(
                24,
                Math.max(
                    5,
                    distance * 0.035
                )
            );


        robotX +=
            (dx / distance) *
            speed;

        robotY +=
            (dy / distance) *
            speed;


        clampRobotPosition();

        updateRobotPosition();


        await new Promise(
            resolve =>
                requestAnimationFrame(
                    resolve
                )
        );
    }


    robotX =
        robotTargetX;

    robotY =
        robotTargetY;

    updateRobotPosition();
}


/* ---------------------------------------------------------
   Finish loader
   --------------------------------------------------------- */

async function finishLoader() {

    if (loaderFinished) {
        return;
    }

    loaderFinished = true;


    if (loaderStatus) {

        loaderStatus.textContent =
            "DEBUGGING SUCCESSFULLY COMPLETED";
    }


    if (debugMessage) {

        debugMessage.textContent =
            "DEBUGGING SUCCESSFULLY COMPLETED";

        debugMessage.classList.add(
            "success"
        );
    }


    if (debugBar) {

        debugBar.classList.add(
            "active"
        );
    }


    if (debugProgress) {

        debugProgress.style.width =
            "100%";
    }


    await sleep(850);


    if (loader) {

        loader.classList.add(
            "complete"
        );
    }


    document.body.classList.add(
        "site-ready"
    );


    await sleep(850);


    if (loader) {

        loader.style.display =
            "none";
    }
}


/* ---------------------------------------------------------
   Run Debug button
   --------------------------------------------------------- */

if (runButton) {

    runButton.addEventListener(
        "click",
        async () => {

            if (
                debugStarted ||
                loaderFinished
            ) {
                return;
            }


            debugStarted = true;

            runButton.disabled =
                true;


            if (loaderStatus) {

                loaderStatus.textContent =
                    "DEBUGGING SYSTEM...";
            }


            if (debugMessage) {

                debugMessage.textContent =
                    "MIR IS ANALYZING THE SYSTEM";
            }


            runButton.classList.add(
                "running"
            );


            await chaseRunButton();


            await sleep(350);


            if (debugMessage) {

                debugMessage.textContent =
                    "CHECKING CORE MODULES...";
            }


            if (debugProgress) {

                debugProgress.style.width =
                    "35%";
            }


            await sleep(500);


            if (debugMessage) {

                debugMessage.textContent =
                    "VERIFYING INTERFACE...";
            }


            if (debugProgress) {

                debugProgress.style.width =
                    "65%";
            }


            await sleep(500);


            if (debugMessage) {

                debugMessage.textContent =
                    "FINALIZING SYSTEM...";
            }


            if (debugProgress) {

                debugProgress.style.width =
                    "85%";
            }


            await sleep(500);


            await finishLoader();
        }
    );
}


/* ---------------------------------------------------------
   Prepare robot
   --------------------------------------------------------- */

if (robotImage) {

    if (robotImage.complete) {

        removeWhiteBackground(
            robotImage
        );

        randomRobotPosition();

    } else {

        robotImage.addEventListener(
            "load",
            () => {

                removeWhiteBackground(
                    robotImage
                );

                randomRobotPosition();

            },
            {
                once: true
            }
        );
    }
}


/* ---------------------------------------------------------
   Start robot animation
   --------------------------------------------------------- */

if (robot) {

    randomRobotPosition();

    requestAnimationFrame(
        animateRobot
    );
}


/* ---------------------------------------------------------
   Recalculate robot on resize
   --------------------------------------------------------- */

window.addEventListener(
    "resize",
    () => {

        if (!robot) return;

        clampRobotPosition();

        if (!debugStarted) {
            chooseRoamingTarget();
        }

        updateRobotPosition();

    },
    {
        passive: true
    }
);


/* =========================================================
   CONTACT FORM — FORMSPREE
   ========================================================= */

const contactModal =
    $("#contactModal");

const talkButton =
    $("#talkButton");

const closeContact =
    $("#closeContact");

const contactForm =
    $("#contactForm");

const contactSubmit =
    $("#contactSubmit");


/* ---------------------------------------------------------
   Open contact modal
   --------------------------------------------------------- */

function openContact() {

    if (!contactModal) {
        return;
    }


    contactModal.classList.add(
        "open"
    );


    document.body.classList.add(
        "contact-open"
    );


    setTimeout(
        () => {

            const firstInput =
                contactForm?.querySelector(
                    "input"
                );

            if (firstInput) {
                firstInput.focus();
            }

        },
        150
    );
}


/* ---------------------------------------------------------
   Close contact modal
   --------------------------------------------------------- */

function closeContactModal() {

    if (!contactModal) {
        return;
    }


    contactModal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "contact-open"
    );
}


/* ---------------------------------------------------------
   Let's Talk button
   --------------------------------------------------------- */

if (talkButton) {

    talkButton.addEventListener(
        "click",
        openContact
    );
}


/* ---------------------------------------------------------
   Close contact button
   --------------------------------------------------------- */

if (closeContact) {

    closeContact.addEventListener(
        "click",
        closeContactModal
    );
}


/* ---------------------------------------------------------
   Click outside contact box
   --------------------------------------------------------- */

if (contactModal) {

    contactModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                contactModal
            ) {

                closeContactModal();
            }
        }
    );
}


/* ---------------------------------------------------------
   Escape closes contact
   --------------------------------------------------------- */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            contactModal?.classList.contains(
                "open"
            )
        ) {

            closeContactModal();
        }

    }
);


/* ---------------------------------------------------------
   Formspree submission
   --------------------------------------------------------- */

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!contactSubmit) {
                return;
            }


            const originalText =
                contactSubmit.textContent;


            contactSubmit.disabled =
                true;


            contactSubmit.textContent =
                "Sending...";


            try {

                const formData =
                    new FormData(
                        contactForm
                    );


                const response =
                    await fetch(
                        contactForm.action,
                        {
                            method: "POST",

                            body: formData,

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                let data = {};


                try {

                    data =
                        await response.json();

                } catch {

                    data = {};
                }


                if (!response.ok) {

                    throw new Error(
                        data?.errors
                            ?.map(
                                error =>
                                    error.message
                            )
                            .join(", ") ||
                        "Unable to send message."
                    );
                }


                contactSubmit.textContent =
                    "Message Sent ✓";


                contactSubmit.classList.add(
                    "success"
                );


                contactForm.reset();


                await sleep(1800);


                contactSubmit.classList.remove(
                    "success"
                );


                contactSubmit.textContent =
                    originalText;


                closeContactModal();


            } catch (error) {

                console.error(
                    "Formspree error:",
                    error
                );


                contactSubmit.textContent =
                    "Try Again ↻";


                contactSubmit.classList.add(
                    "error"
                );


                await sleep(2200);


                contactSubmit.classList.remove(
                    "error"
                );


                contactSubmit.textContent =
                    originalText;

            } finally {

                contactSubmit.disabled =
                    false;
            }
        }
    );
}


/* =========================================================
   MIR AI CHATBOT
   ========================================================= */

const mirWidget =
    $("#mirWidget");

const chatPanel =
    $("#chatPanel");

const closeChat =
    $("#closeChat");

const chatForm =
    $("#chatForm");

const chatInput =
    $("#chatInput");

const chatMessages =
    $("#chatMessages");


let chatHistory = [];

let mirIsThinking = false;


/* ---------------------------------------------------------
   Open MIR
   --------------------------------------------------------- */

function openMIR() {

    if (!chatPanel) {
        return;
    }


    chatPanel.classList.add(
        "open"
    );


    chatPanel.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "chat-open"
    );


    setTimeout(
        () => {

            if (chatInput) {
                chatInput.focus();
            }

        },
        180
    );
}


/* ---------------------------------------------------------
   Close MIR
   --------------------------------------------------------- */

function closeMIR() {

    if (!chatPanel) {
        return;
    }


    chatPanel.classList.remove(
        "open"
    );


    chatPanel.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "chat-open"
    );
}


/* ---------------------------------------------------------
   MIR character click
   --------------------------------------------------------- */

if (mirWidget) {

    mirWidget.addEventListener(
        "click",
        openMIR
    );


    mirWidget.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openMIR();
            }

        }
    );
}


/* ---------------------------------------------------------
   Close MIR
   --------------------------------------------------------- */

if (closeChat) {

    closeChat.addEventListener(
        "click",
        closeMIR
    );
}


/* =========================================================
   CHAT MESSAGE SYSTEM
   ========================================================= */

/*
 * IMPORTANT FIX:
 *
 * Previous version created:
 *
 *     class="message user"
 *
 * But the CSS uses:
 *
 *     .chat-message.user
 *
 * So the messages were not receiving the correct
 * left/right styling.
 */


/* ---------------------------------------------------------
   Add chat message
   --------------------------------------------------------- */

function addMessage(
    text,
    type = "bot"
) {

    if (!chatMessages) {
        return null;
    }


    const message =
        document.createElement(
            "div"
        );


    /*
     * Correct class:
     *
     * chat-message bot
     * chat-message user
     */

    message.className =
        `chat-message ${type}`;


    /*
     * textContent keeps the chatbot
     * safe from HTML injection.
     */

    message.textContent =
        String(text ?? "");


    chatMessages.appendChild(
        message
    );


    /*
     * Always move to newest message.
     */

    requestAnimationFrame(
        () => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        }
    );


    return message;
}


/* ---------------------------------------------------------
   Thinking indicator
   --------------------------------------------------------- */

function addThinkingMessage() {

    if (!chatMessages) {
        return null;
    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "chat-message bot thinking";


    message.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;


    chatMessages.appendChild(
        message
    );


    requestAnimationFrame(
        () => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        }
    );


    return message;
}


/* =========================================================
   SEND MESSAGE TO MIR BACKEND
   ========================================================= */

async function sendToMIR(text) {

    const cleanText =
        String(
            text || ""
        ).trim();


    if (!cleanText) {
        return;
    }


    if (mirIsThinking) {
        return;
    }


    mirIsThinking = true;


    /*
     * USER MESSAGE
     *
     * This now appears on the RIGHT.
     */

    addMessage(
        cleanText,
        "user"
    );


    if (chatInput) {

        chatInput.value =
            "";

        chatInput.disabled =
            true;
    }


    const thinking =
        addThinkingMessage();


    try {

        /*
         * Send message and previous
         * conversation to Node backend.
         */

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                cleanText,

                            history:
                                chatHistory.slice(
                                    -12
                                )
                        })
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch {

            data = {};
        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                `Server returned ${response.status}`
            );
        }


        const reply =
            typeof data.reply === "string"
                ? data.reply.trim()
                : "";


        if (!reply) {

            throw new Error(
                "MIR returned an empty response."
            );
        }


        /*
         * Remove thinking indicator.
         */

        if (thinking) {
            thinking.remove();
        }


        /*
         * BOT MESSAGE
         *
         * This appears on the LEFT.
         */

        addMessage(
            reply,
            "bot"
        );


        /*
         * Save conversation.
         */

        chatHistory.push({

            role: "user",

            content:
                cleanText
        });


        chatHistory.push({

            role: "assistant",

            content:
                reply
        });


        /*
         * Keep conversation history
         * reasonably small.
         */

        if (
            chatHistory.length >
            20
        ) {

            chatHistory =
                chatHistory.slice(
                    -20
                );
        }


    } catch (error) {

        console.error(
            "MIR connection error:",
            error
        );


        if (thinking) {
            thinking.remove();
        }


        let errorMessage =
            "I'm having trouble reaching my AI core right now.";


        if (
            error?.message
                ?.includes(
                    "Failed to fetch"
                )
        ) {

            errorMessage +=
                " Make sure the MIR server is running.";

        } else {

            errorMessage +=
                " Please try again in a moment.";
        }


        /*
         * Error is also a BOT message,
         * therefore it appears on the LEFT.
         */

        addMessage(
            errorMessage,
            "bot"
        );


    } finally {

        mirIsThinking =
            false;


        if (chatInput) {

            chatInput.disabled =
                false;

            chatInput.focus();
        }
    }
}


/* =========================================================
   CHAT FORM
   ========================================================= */

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            if (!chatInput) {
                return;
            }


            sendToMIR(
                chatInput.value
            );
        }
    );
}


/* =========================================================
   QUICK ACTION BUTTONS
   ========================================================= */

/*
 * FIX:
 *
 * Your HTML uses:
 *
 * .quick-actions button
 *
 * Previous JS was looking for:
 *
 * .mir-quick
 *
 * So the quick buttons weren't being detected.
 */

$$(
    ".quick-actions button[data-mir-prompt]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const prompt =
                    button.dataset
                        .mirPrompt;


                if (!prompt) {
                    return;
                }


                openMIR();


                sendToMIR(
                    prompt
                );
            }
        );
    }
);


/* =========================================================
   ENTER / ESCAPE CHAT BEHAVIOR
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            chatPanel?.classList.contains(
                "open"
            )
        ) {

            closeMIR();
        }

    }
);


/* =========================================================
   PAGE / NAVIGATION BEHAVIOR
   ========================================================= */

const logo =
    $(".logo");


if (logo) {

    logo.addEventListener(
        "click",
        event => {

            event.preventDefault();


            window.scrollTo({

                top: 0,

                behavior: "smooth"
            });

        }
    );
}


/* =========================================================
   PREVENT ACCIDENTAL IMAGE DRAGGING
   ========================================================= */

$$("img").forEach(
    image => {

        image.addEventListener(
            "dragstart",
            event => {

                event.preventDefault();
            }
        );
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Make sure loader starts visible.
         */

        if (loader) {

            loader.classList.remove(
                "complete"
            );
        }


        /*
         * Reset chatbot state.
         */

        chatHistory = [];

        mirIsThinking = false;


        /*
         * Make sure chat starts
         * at the bottom.
         */

        if (chatMessages) {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        }


        /*
         * Development console.
         */

        console.log(
            "%c MIR.PY ",
            "background:#111;color:#9cff57;padding:5px 8px;border-radius:5px;font-weight:bold"
        );


        console.log(
            "MIR frontend initialized."
        );


        console.log(
            "Chat endpoint: /api/chat"
        );

    }
);