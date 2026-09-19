// ============================================
// EDIT YOUR INFO HERE: everything is in one place
// ============================================

export const siteData = {
  name: "Dinh",
  // shown in hero: edit to your real name
  hero: {
    title: "I make stuff",
    titleAccent: "and play sports.",
    subtitle:
      "I like figuring out how things work, then seeing what I can build. When something interests me, I turn it into ideas to try.",
    status: "Right now exploring Arduino, Python and how things work",
  },

  // About: keep it human, not a resume
  about: {
    paragraphs: [
      "I'm pretty quiet when I first meet people. I don't talk much at the start and I like to listen and observe first. It takes me a little while to feel comfortable.",
      "Once I'm comfortable with someone I talk a lot more. That's when I like showing what I'm working on, like a circuit I just got working or an idea I'm testing. I'm also fairly competitive and I sometimes overthink things, especially when I care about getting something right.",
      "I like having freedom to do things my own way. I work best when I have independence and room to experiment, not when I'm told exactly how something has to be done. That's when I learn and enjoy it most.",
    ],
    traits: ["Quiet at first", "Talkative when comfortable", "Competitive", "Overthinker", "Values freedom", "Independent"],
  },

  whatIDo: [
    {
      id: "arduino",
      label: "01: Hands-on",
      title: "Arduino",
      desc: "I like figuring out how electronics work. Wiring, testing, and seeing what happens when I change something.",
      tags: ["Experiment", "Wiring", "Sensors", "Hands-on"],
      icon: "◈",
    },
    {
      id: "python",
      label: "02: Code",
      title: "Python",
      desc: "Python is how I turn ideas into real things. I use it most when I want to build and figure things out.",
      tags: ["Python", "Logic", "Automation", "Learning"],
      icon: "◎",
    },
    {
      id: "programming",
      label: "03: Building",
      title: "Programming",
      desc: "I like making things work through code. Trying, getting stuck, fixing it, and seeing it run.",
      tags: ["Code", "Problem solving", "Debugging", "Build"],
      icon: "⬢",
    },
    {
      id: "understanding",
      label: "04: Curiosity",
      title: "Understanding Tech",
      desc: "I'm curious how things work underneath, not just using them. I want to know why.",
      tags: ["Curiosity", "How it works", "Exploring", "Tech"],
      icon: "◧",
    },
    {
      id: "building",
      label: "05: Making",
      title: "Building Projects",
      desc: "I like asking what I could actually build with this, then trying to make it real.",
      tags: ["Ideas", "Making", "Prototype", "Create"],
      icon: "✦",
    },
    {
      id: "gaming",
      label: "06: Casual",
      title: "Gaming (Casual)",
      desc: "I still enjoy gaming casually, but I don't grind for hours like I used to.",
      tags: ["Casual", "Balance", "Fun", "Break"],
      icon: "◎",
    },
  ],

  strengths: [
    {
      title: "Creative when interested",
      desc: "My creativity is strongest when I'm interested. I get ideas for things I can actually build.",
      detail: "Interest → Idea → Build",
    },
    {
      title: "Independent",
      desc: "I try things myself first. I like figuring it out my own way by experimenting.",
      detail: "Try → Learn → Adjust",
    },
    {
      title: "Curious about how things work",
      desc: "I want to know why something works, not just that it does. That leads to ideas.",
      detail: "Why → How → Make",
    },
    {
      title: "Hands-on",
      desc: "I learn by doing. I try a rough version and improve it as I go.",
      detail: "Make → Test → Improve",
    },
  ],

  growth: {
    title: "From answers to understanding.",
    story: {
      before: "Before, I focused on getting the answer first. If I found a solution online, I thought I was done.",
      work: "Now I try to understand why it works. If I'm stuck I look up help, then I try again myself until it makes sense.",
      after: "That made me more independent. I still use resources, but the goal is understanding it well enough to do it myself.",
    },
    principle: "I don't just want the answer. I want to understand it and be able to do it myself.",
  },

  projects: [
    {
      title: "AI + 16x2 LCD",
      desc: "I combined programming and electronics to show AI text on a 16x2 LCD. It took curiosity, wiring, and experimenting until it worked.",
      tech: ["Arduino", "Python", "16x2 LCD", "AI"],
      learned: "How to connect code and hardware and keep experimenting until it works.",
      status: "Built",
      links: { github: "", demo: "" },
      image: "",
    },
    {
      title: "Gaming, more intentionally",
      desc: "I used to game much longer. Now I enjoy it casually without letting it take over my time.",
      tech: ["Balance", "Time"],
      learned: "Enjoying something without overdoing it.",
      status: "Personal growth",
      links: { github: "", demo: "" },
      image: "",
    },
    {
      title: "What I want to build next",
      desc: "I like having something new to figure out next. It keeps me curious.",
      tech: ["Ideas", "Experimenting"],
      learned: "There's always something new to try.",
      status: "In progress",
      links: { github: "", demo: "" },
      image: "",
    },
  ],

  goals: [
    { k: "Financial independence", v: "I want work that gives me financial independence and choices in how I live." },
    { k: "Freedom", v: "I want freedom to approach things my own way, not just how I'm told." },
    { k: "Career I enjoy", v: "I want a career I enjoy, not just one that sounds impressive. Tech and engineering interest me." },
    { k: "Keep developing", v: "I'm still figuring out where I'm heading, but I want to keep learning." },
  ],

  // Leave empty: will show an inviting empty state
  highlights: [],

  personal: {
    now: [
      "Adapting when something doesn't go as planned",
      "Trying a different approach instead of getting stuck",
    ],
    learning: [
      "Finding ideas even for topics I don't naturally enjoy",
      "Looking for ways to stay creative outside my interests",
    ],
    improving: [
      "Keeping effort going even when I'm less motivated",
      "Building consistency over time, not just in bursts",
    ],
  },

  contact: {
    email: "",
    github: "",
    note: "Quiet at first, but I like talking about what I'm building once I get comfortable. Feel free to reach out if you want to talk about projects or ideas.",
  },
}
