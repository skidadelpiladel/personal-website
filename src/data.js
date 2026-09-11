// ============================================
// EDIT YOUR INFO HERE — everything is in one place
// ============================================

export const siteData = {
  name: "Dinh",
  // shown in hero — edit to your real name
  hero: {
    title: "I make stuff",
    titleAccent: "and play sports.",
    subtitle:
      "I'm into Arduino, basketball and football. I just like trying stuff, figuring it out myself, and getting a little better as I go.",
    status: "Right now just messing with Arduino and working on my game",
  },

  // About — keep it human, not a résumé
  about: {
    paragraphs: [
      "I'm pretty reserved when I first meet someone. I won't be the loudest in the room — I'll listen, observe, and take my time.",
      "Once I'm comfortable with someone, that's when I open up. I like showing people close to me what I'm working on — a circuit I just got to work, a move I've been practicing, something I sketched.",
      "My friends would probably describe me as shy, independent, and good at English. That feels about right. I like figuring things out myself, but I also like sharing the process with people I trust.",
    ],
    traits: ["Reserved at first", "Talkative when comfortable", "Independent", "Shares the process"],
  },

  whatIDo: [
    {
      id: "arduino",
      label: "01 — Making",
      title: "Arduino & Projects",
      desc: "What I love is turning an idea into something real. Wiring it up, debugging it, watching it finally work. Every project teaches me something I didn't know before.",
      tags: ["Experiment", "Build", "Debug", "Repeat"],
      icon: "◈",
    },
    {
      id: "basketball",
      label: "02 — Movement",
      title: "Basketball",
      desc: "I think a lot about combinations, footwork, and positioning. How to get into the paint, how to read the play, how to get better at one thing at a time.",
      tags: ["Footwork", "Positioning", "Rebounds", "Drive"],
      icon: "◎",
    },
    {
      id: "football",
      label: "03 — Precision",
      title: "Football",
      desc: "Passing is what I'm focused on right now — weight, timing, accuracy. Small adjustments that make a big difference on the field.",
      tags: ["Passing", "Timing", "Control", "Practice"],
      icon: "⬢",
    },
    {
      id: "creativity",
      label: "04 — Ideas",
      title: "Art & Creativity",
      desc: "Creativity for me isn't just drawing — it's how ideas connect. A sketch becomes a project idea. A project idea becomes something I build.",
      tags: ["Sketches", "Ideas", "Concepts", "Making"],
      icon: "✦",
    },
  ],

  strengths: [
    {
      title: "Creativity with purpose",
      desc: "Not creativity for its own sake. I get ideas and want to try them — through art, through projects, through experimenting until something clicks.",
      detail: "Art → Idea → Build",
    },
    {
      title: "Independent",
      desc: "I'm comfortable working alone and figuring things out. I like the process of trying, failing, adjusting, trying again.",
      detail: "Try → Learn → Adjust",
    },
    {
      title: "Progress-driven",
      desc: "What keeps me going is seeing that I'm better than last week. Even small improvements feel meaningful when you earned them.",
      detail: "Practice → Progress → Next",
    },
    {
      title: "Curious & hands-on",
      desc: "I learn by doing. I'd rather build a rough version and improve it than wait until I know everything.",
      detail: "Make → Test → Improve",
    },
  ],

  growth: {
    title: "Growth isn't instant. It's footwork.",
    story: {
      before: "I struggled to drive into the paint and get into position for rebounds. I was often a step late or out of position.",
      work: "So I worked on it. Footwork — deliberately, repeatedly. Positioning, timing, balance.",
      after: "Now I'm more comfortable attacking the paint and using better footwork in those moments. Not perfect — but clearly better. And that's the point.",
    },
    principle: "I may not be good at something immediately, but I enjoy improving until I can see the difference.",
  },

  projects: [
    {
      title: "Your next Arduino build",
      desc: "Add your Arduino project here — what it does, what you used, what you learned. Replace this placeholder when ready.",
      tech: ["Arduino", "C++", "Sensors"],
      learned: "What did this project teach you?",
      status: "Placeholder — easy to edit in Admin",
      links: { github: "", demo: "" },
      image: "",
    },
    {
      title: "Another experiment",
      desc: "A second project slot. Could be a basketball training tracker, a football passing drill timer, or something completely different.",
      tech: ["Your", "Tech", "Here"],
      learned: "Add your reflection here.",
      status: "Placeholder",
      links: { github: "", demo: "" },
      image: "",
    },
    {
      title: "Future build",
      desc: "Leave this empty until you have something new to show. The grid is ready when you are.",
      tech: ["To be added"],
      learned: "Progress over perfection.",
      status: "Coming soon",
      links: { github: "", demo: "" },
      image: "",
    },
  ],

  goals: [
    { k: "Learn", v: "Keep picking up new skills — in tech, in sports, in everything I'm curious about." },
    { k: "Build", v: "Make more projects. Bigger, more interesting, more useful." },
    { k: "Improve", v: "Get better on the court and the field — footwork, passing, positioning." },
    { k: "Repeat", v: "Finish something, then start the next thing. See how far I can take it." },
  ],

  // Leave empty — will show an inviting empty state
  highlights: [],

  personal: {
    now: [
      "Tinkering with Arduino and planning the next build",
      "Working on footwork and driving into the paint",
      "Practicing passing — weight and accuracy",
      "Sketching ideas that might become projects",
    ],
    learning: ["How circuits behave in practice, not just theory", "Better court positioning through repetition", "That small, consistent work adds up"],
    improving: ["Consistency in training", "Finishing projects I start", "Sharing what I make more openly"],
  },

  contact: {
    email: "",
    github: "",
    note: "Quiet at first, but I love talking about projects once we get going. Reach out if you want to talk builds, basketball, or ideas.",
  },
}
