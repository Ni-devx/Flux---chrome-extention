// lang/en.js
const en = {
    // Block page
    block: {
        title: "This site is blocked.",
        message: "Do you really need<br>to visit this site?",
        titleReturn: "You're back again.",
        messageReturn: "Think twice.<br>Is this visit necessary?",
        titleMultiple: "Visit #{count} today.",
        messageMultiple1: "Take a break?<br>Let's regain focus.",
        messageMultiple2: "You're visiting frequently.<br>Do you really need this now?",
        btnBack: "Back to Work",
        btnEdit: "Edit",
        timeModal: "Set Duration",
        minutes: "minutes",
        cancel: "Cancel",
        confirm: "OK",
        validationError: "Please enter a value between 1 and 1440 minutes",
        loading: "Loading..."
    },
    
    // Popup
    popup: {
        title: "Flux",
        extensionToggle: "Extension",
        toggleDescription: "Enable/Disable blocking",
        statusActive: "Active",
        statusInactive: "Inactive",
        blockedSites: "Blocked Sites",
        activeNow: "Active Now",
        openSettings: "Open Settings"
    },
    
    // Settings - Sidebar
    sidebar: {
        blockSite: "Block Site",
        feedback: "Feedback",
        update: "Updates",
        howToUse: "How to Use",
        language: "Language",
        close: "← Close"
    },
    
    // Settings - Block Site Section
    blockSite: {
        title: "Block Sites",
        description: "Register sites that distract you from focus.<br>Access will be blocked and requires one step to allow.",
        addNew: "Add New Site",
        placeholder: "example.com",
        quickAdd: "Quick Add:",
        registered: "Registered Sites",
        count: "sites",
        empty: "No sites registered yet.",
        defaultTime: "Default:",
        timeLabel: "Default Duration",
        applyToAll: "Apply to All",
        applyToAllConfirm: "Set all sites' duration to {time}?",
        sliderMin: "1 min",
        sliderMax: "3 hours",
        adding: "Adding...",
        invalidDomain: "Invalid domain. Example: youtube.com",
        addError: "Error: Please reload the extension.",
        addFailed: "Failed to add: ",
        deleteTitle: "Delete",
        deleteFailed: "Failed to delete"
    },
    
    // Settings - Feedback Section
    feedback: {
        title: "Feedback",
        description: "We'd love to hear from you.",
        name: "Name (optional)",
        namePlaceholder: "John Doe",
        email: "Email (optional) - If you wish to reply, please let me know that in Messages.",
        emailPlaceholder: "example@email.com",
        type: "Feedback Type",
        typeSelect: "Please select",
        typeBug: "Bug Report",
        typeFeature: "Feature Request",
        typeImprovement: "Improvement",
        typeOther: "Other",
        message: "Message *",
        messagePlaceholder: "Please tell us more...",
        submit: "Submit",
        submitting: "Submitting...",
        success: "Thank you for your feedback!",
        error: "An error occurred. Please try again."
    },
    
    // Settings - Update Section
    update: {
        title: "Updates",
        description: "Latest news about Flux. - English ver. is not yet supported.",
        version: "v1.0.0",
        date: "2025-01-01",
        releaseTitle: "Initial Release 🎉",
        feature1: "Site blocking functionality",
        feature2: "Temporary allow feature",
        feature3: "Per-domain default time settings",
        feature4: "Intentional access UI/UX",
        roadmapTitle: "Roadmap",
        roadmap1Title: "Statistics",
        roadmap1Desc: "Visualize blocked counts and time",
        roadmap2Title: "Scheduling",
        roadmap2Desc: "Time-based blocking rules",
        roadmap3Title: "Groups",
        roadmap3Desc: "Categorize and manage sites"
    },
    
    // Settings - How to Use Section
    howToUse: {
        title: "How to Use",
        description: "Learn the basics of Flux.",
        addTitle: "Adding Sites",
        addStep1: "Go to the \"Block Sites\" section.",
        addStep2: "Enter the domain you want to block (e.g., example.com).",
        addStep3: "Click the \"+\" button to add the site.",
        removeTitle: "Removing Sites",
        removeStep1: "Go to the \"Block Sites\" section.",
        removeStep2: "Find the site you want to remove in the list.",
        removeStep3: "Click the \"×\" button next to the site to remove it."
    },
    
    // Settings - Language Section
    language: {
        title: "Language Settings",
        description: "Select your preferred language.",
        select: "Select language:",
        japanese: "日本語",
        english: "English"
    },
    
    // Time format
    time: {
        minutes: "{num} min",
        hours: "{num} hr",
        hoursMinutes: "{hours} hr {minutes} min"
    },

    modal: {
        title: "Confirm",
        cancel: "Cancel",
        confirm: "Apply"
    }
};