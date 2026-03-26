const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Mock Data
const doctors = [
    { id: 1, name: "Dr. Sarah Taylor", dep: "Cardiology", days: ["Monday", "Wednesday", "Friday"], slots: ["10:00 AM", "2:00 PM"] },
    { id: 2, name: "Dr. James Smith", dep: "Pediatrics", days: ["Tuesday", "Thursday"], slots: ["9:00 AM", "11:30 AM", "4:00 PM"] },
    { id: 3, name: "Dr. Emily Chen", dep: "Dermatology", days: ["Monday", "Thursday", "Friday"], slots: ["1:00 PM", "3:30 PM"] },
];

let bookingState = {
    step: "GREETING", 
    data: {}
};

window.addEventListener('DOMContentLoaded', () => {
    addBotMessage("Hi there! 👋 I'm MedBot. How can I help you today?", [
        { label: "Book Appointment", value: "book" },
        { label: "Check Doctors", value: "doctors" }
    ]);
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    userInput.value = '';
    
    processInput(text);
});

function processInput(text, isOptionAction = false) {
    const indicatorId = showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator(indicatorId);
        
        const lower = text.toLowerCase();
        
        if (bookingState.step === "GREETING") {
            if (lower.includes("book") || lower.includes("appointment")) {
                bookingState.step = "DEPARTMENT_SELECTION";
                const deps = [...new Set(doctors.map(d => d.dep))];
                
                addBotMessage("Great! I can help with that. Which department are you looking for?", 
                    deps.map(d => ({ label: d, value: d }))
                );
            } else if (lower.includes("doctor") || isOptionAction) {
               addBotMessage("We have specialists in Cardiology, Pediatrics, and Dermatology. Would you like to book an appointment?", [
                   { label: "Yes, book now", value: "book" }
               ]); 
            } else {
                addBotMessage("I didn't quite catch that. You can say 'Book appointment' to get started.");
            }
        } 
        else if (bookingState.step === "DEPARTMENT_SELECTION") {
            const selectedDoc = doctors.find(d => d.dep.toLowerCase() === lower);
            if (selectedDoc) {
                bookingState.data.doctor = selectedDoc;
                bookingState.step = "DAY_SELECTION";
                addBotMessage(`Awesome! ${selectedDoc.name} is available for ${selectedDoc.dep}. Please select a preferred day:`,
                    selectedDoc.days.map(day => ({ label: day, value: day }))
                );
            } else {
                addBotMessage("We couldn't find that department. Please select from:", 
                    [...new Set(doctors.map(d => ({ label: d.dep, value: d.dep })))]
                );
            }
        }
        else if (bookingState.step === "DAY_SELECTION") {
            const doc = bookingState.data.doctor;
            if (doc.days.map(d => d.toLowerCase()).includes(lower)) {
                bookingState.data.day = text;
                bookingState.step = "SLOT_SELECTION";
                addBotMessage(`Perfect. On ${text}, ${doc.name} has these slots available:`,
                    doc.slots.map(s => ({ label: s, value: s }))
                );
            } else {
                addBotMessage("Please pick a valid day from their schedule.", 
                     doc.days.map(day => ({ label: day, value: day }))
                );
            }
        }
        else if (bookingState.step === "SLOT_SELECTION") {
            const doc = bookingState.data.doctor;
            if (doc.slots.map(s => s.toLowerCase()).includes(lower)) {
                bookingState.data.slot = text;
                bookingState.step = "ASK_NAME";
                addBotMessage(`You've selected ${text} on ${bookingState.data.day} with ${doc.name}. Before we confirm, could I please get your full name?`);
            } else {
                addBotMessage("Please select a valid time slot.",
                    doc.slots.map(s => ({ label: s, value: s }))
                );
            }
        }
        else if (bookingState.step === "ASK_NAME") {
            bookingState.data.name = text;
            bookingState.step = "ASK_AGE";
            addBotMessage(`Nice to meet you, ${text}! Could you please provide your age?`);
        }
        else if (bookingState.step === "ASK_AGE") {
            bookingState.data.age = text;
            bookingState.step = "ASK_PHONE";
            addBotMessage(`Got it. Lastly, what is your phone number?`);
        }
        else if (bookingState.step === "ASK_PHONE") {
            bookingState.data.phone = text;
            bookingState.step = "CONFIRMATION";
            let d = bookingState.data;
            addBotMessage(`Thanks! Let's review your details:
Name: ${d.name}
Age: ${d.age}
Phone: ${d.phone}
Appointment: ${d.day} at ${d.slot} with ${d.doctor.name}

Shall I confirm this booking?`,
                [{label: "Confirm ✅", value:"yes"}, {label: "Cancel ❌", value: "no"}]
            );
        }
        else if (bookingState.step === "CONFIRMATION") {
            if (lower === "yes" || lower.includes("confirm") || lower.includes("✅")) {
                let d = bookingState.data;
                lastConfirmedAppointment = { ...d };
                const btn = document.getElementById('download-appt-btn');
                if (btn) btn.style.display = 'block';
                
                addBotMessage(`🎉 Appointment Confirmed for ${d.name}! We have scheduled you with ${d.doctor.name} on ${d.day} at ${d.slot}. Stay healthy!`);
                bookingState = { step: "GREETING", data: {} };
                setTimeout(() => {
                    addBotMessage("Is there anything else I can help you with?", [{label:"Book another", value:"book"}]);
                }, 2000);
            } else {
                addBotMessage("Booking cancelled. Let me know if you want to start over.", [{label:"Start over", value:"book"}]);
                bookingState = { step: "GREETING", data: {} };
            }
        }
        
    }, 800);
}

function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message msg-user';
    div.textContent = text;
    chatWindow.appendChild(div);
    scrollToBottom();
}

function addBotMessage(text, options = null) {
    const div = document.createElement('div');
    div.className = 'message msg-bot';
    div.textContent = text;
    
    if (options && options.length > 0) {
        const optsContainer = document.createElement('div');
        optsContainer.className = 'options-container';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.label;
            btn.onclick = () => {
                Array.from(optsContainer.children).forEach(b => b.disabled = true);
                if (bookingState.step === "CONFIRMATION" && opt.label.includes("Confirm")) {
                    addUserMessage("Confirm ✅");
                } else if (bookingState.step === "CONFIRMATION" && opt.label.includes("Cancel")) {
                    addUserMessage("Cancel ❌");
                } else {
                    addUserMessage(opt.label);
                }
                processInput(opt.value, true);
            };
            optsContainer.appendChild(btn);
        });
        
        div.appendChild(optsContainer);
    }
    
    chatWindow.appendChild(div);
    scrollToBottom();
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message msg-bot';
    div.id = id;
    div.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatWindow.appendChild(div);
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) {
    const div = document.getElementById(id);
    if (div) div.remove();
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Download Appointment functionality
let lastConfirmedAppointment = null;
const downloadApptBtn = document.getElementById('download-appt-btn');
if (downloadApptBtn) {
    downloadApptBtn.style.display = 'none'; // hidden initially
    downloadApptBtn.addEventListener('click', () => {
        if (!lastConfirmedAppointment) {
            alert("No appointment confirmed yet!");
            return;
        }
        
        const d = lastConfirmedAppointment;
        let content = `----- MedCare Appointment Details -----\n`;
        content += `Date: ${new Date().toLocaleDateString()}\n\n`;
        content += `Patient Name: ${d.name}\n`;
        content += `Age: ${d.age}\n`;
        content += `Contact: ${d.phone}\n\n`;
        content += `Doctor: ${d.doctor.name} (${d.doctor.dep})\n`;
        content += `Schedule: ${d.day} at ${d.slot}\n`;
        content += `---------------------------------------\n`;
        
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `MedCare_Appointment_${dateStr}.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
