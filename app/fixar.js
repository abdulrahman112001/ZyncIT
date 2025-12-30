const fs = require("fs");
const p = "C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx";
let c = fs.readFileSync(p, "utf8");

// Replace by matching the English and replacing both
const replacements = [
    ["Calls", "\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062a"],
    ["message", "\u0631\u0633\u0627\u0644\u0629"],
    ["call", "\u0627\u062a\u0635\u0627\u0644"],
    ["video", "\u0641\u064a\u062f\u064a\u0648"],
    ["mail", "\u0628\u0631\u064a\u062f"],
    ["Details", "\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644"],
    ["Voicemails", "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0635\u0648\u062a\u064a"],
    ["Call History", "\u0633\u062c\u0644 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062a"],
    ["Phone", "\u0627\u0644\u0647\u0627\u062a\u0641"],
    ["mobile", "\u0645\u062d\u0645\u0648\u0644"],
    ["Block this Caller", "\u062d\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0645\u062a\u0635\u0644"]
];

for (const [en, ar] of replacements) {
    const regex = new RegExp(`isRTL \\? '[^']+' : '${en.replace(/\s/g, "\\s")}'`, "g");
    c = c.replace(regex, `isRTL ? '${ar}' : '${en}'`);
}

fs.writeFileSync(p, c, "utf8");
console.log("Fixed!");
