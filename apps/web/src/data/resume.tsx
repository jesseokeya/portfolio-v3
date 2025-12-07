import { HomeIcon, NotebookIcon } from "lucide-react";

import { Icons } from "../components/icons";

export const DATA = {
  name: "Jesse Okeya",
  initials: "JO",
  url: "https://jesseokeya.com",
  location: "Ottawa Ontario, CA",
  locationLink: "https://www.google.com/maps/place/ottawa",
  description:
    "Entrepreneurial Software Engineer. I love bringing ideas to life from concept to reality and helping people along the way.",
  summary:
    "Software Engineer with experience across startups and enterprises, from Cloutdesk to Qlik. I've built a comprehensive skill set spanning platform development, cloud services, and web applications. Currently building [AskBenny](https://askbenny.ca), an AI answering service that helps Canadian businesses handle calls intelligently 10x better than voicemail and 10x cheaper than traditional answering services.",
  avatarUrl: "/me.png",
  skills: [
    "Mobile-First, Responsive Design",
    "Cross Browser Testing & Debugging",
    "Cross Functional Teams",
    "Agile Development & Scrum",
    "Object Oriented Design",
    "Algorithms & Data Structures",
    "Build & Deployment",
    "Databases & Source Control (Git)",
    "React",
    "Next.js",
    "Typescript",
    "Node.js",
    "Python",
    "Go",
    "Postgres",
    "Docker",
    "Kubernetes",
    "Java",
  ],

  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
  ],
  contact: {
    email: "jesseokeya@gmail.com",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/jesseokeya",
        icon: Icons.github,

        navbar: true,
      },
      Leetcode: {
        name: "Leetcode",
        url: "https://leetcode.com/u/jesseokeya/",
        icon: Icons.leetcode,

        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/jesse-okeya-45a38510a/",
        icon: Icons.linkedin,

        navbar: true,
      },
      X: {
        name: "X",
        url: "https://x.com/jesse_okeya",
        icon: Icons.x,

        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "#",
        icon: Icons.email,

        navbar: false,
      },
    },
  },

  work: [
    {
      company: "AskBenny",
      href: "https://askbenny.ca/",
      badges: [],
      location: "Toronto Ontario, CA",
      title: "Co-Founder & CTO",
      logoUrl: "/askbenny.png",
      start: "April 2025",
      end: "Present",
      description: `Built AskBenny, an AI answering service that helps Canadian businesses handle calls intelligently 10x better than voicemail and 10x cheaper than traditional answering services. Use coupon code "JESSE25" to get 25% off your first month.`,
    },
    {
      company: "Extend",
      href: "https://www.extend.com/",
      badges: [],
      location: "San Francisco California, USA",
      title: "Backend Software Engineer",
      logoUrl: "/extend.png",
      start: "January 2023",
      end: "June 2025",
      description:
        "Collaborated on designing and implementing event-driven systems with AWS serverless technologies. Worked with engineering, product, and design teams to deliver platform enhancements and simplified customer integrations with third-party platforms. Encouraged innovation and continuous improvement. Developed robust APIs for leading commerce solutions and maintained automated tests to ensure product quality. Designed microservice-based systems and built event-driven architectures using AWS Lambda, DynamoDB, SQS, SNS, API Gateway, and other cloud services.",
    },
    {
      company: "Properly (acquired by Pine)",
      href: "https://www.pine.ca/",
      badges: [],
      location: "Toronto, ON",
      title: "Fullstack Software Engineer",
      logoUrl: "/pine.png",
      start: "December 2021",
      end: "November 2022",
      description:
        "Worked with Python 3, Ruby, Node.js, SQL/NoSQL databases on the server side, and modern JavaScript/CSS/HTML (ES6, CSS4, HTML5) with frameworks like React and Angular on the client side. Contributed to problem-solving sessions, designed small to medium systems, and provided analysis of multiple options. Focused on user-centric features, participated in technical design, and implemented product iterations. Collaborated with a diverse team on UX frameworks, web APIs, and data systems, delivering early experiments, complex projects, and incremental fixes. Took full responsibility for design, code development, testing, deployment, and maintenance.",
    },
    {
      company: "CloutDesk",
      href: "https://www.cloutdesk.com/",
      badges: [],
      location: "Toronto, ON",
      title: "Software Engineer",
      logoUrl: "/cloutdesk.png",
      start: "August 2020",
      end: "December 2021",
      description:
        "Worked with NodeJS, React, and Redux stack to build and scale PostgreSQL databases and GraphQL APIs. Integrated 3rd party APIs like Stripe, Instagram, and Auth0. Developed and delivered end-to-end features for web and mobile apps, using object-oriented development and design patterns. Participated in product scoping, code reviews, and production planning. Partnered with the CEO to align business strategy with the product roadmap and guided the development team through ideation, problem-solving, and project delivery. Developed scalable backend infrastructure solutions.",
    },
    {
      company: "HealthBrain",
      href: "https://www.instagram.com/healthbrainco/?hl=de",
      badges: [],
      location: "Ottawa, ON",
      title: "Software Engineer",
      logoUrl: "/healthbrain.png",
      start: "September 2018",
      end: "October 2019",
      description:
        "Developed data models and database structures, verified system stability and scalability, and prioritized prototyping. Built high-performance web applications using agile methodologies, collaborated closely with a small team, focused on end-user value, and designed interactive UIs with a RESTful Node.js backend.",
    },
    {
      company: "Qlik",
      href: "https://www.qlik.com/us",
      badges: [],
      location: "Ottawa, ON",
      title: "Software Engineer Intern",
      logoUrl: "/qlik.png",
      start: "May 2018",
      end: "September 2018",
      description:
        "Familiarized with designing scalable systems, adopted an iterative development approach, and thrived in a fast-paced, collaborative environment. Took ownership of building end-to-end features across teams, implemented REST-based APIs, and enhanced skills in cloud technologies like AWS, Azure, Docker, Kubernetes, and languages such as JavaScript (Node.js) and Go.",
    },
  ],
  education: [
    {
      school: "Algonquin College",
      href: "https://www.algonquincollege.com/",
      degree: "Advanced Diploma in Computing Science",
      logoUrl: "/algonquin.png",
      start: "2018",
      end: "2020",
    },
    {
      school: "Carletol University",
      href: "https://carleton.ca/",
      degree: "Bachelor's Degree of Computer Science",
      logoUrl: "/carleton.png",
      start: "2015",
      end: "2017",
    },
    {
      school: "GreatLakes College Of Toronto",
      href: "https://glctschool.com/",
      degree: "Computer Technology Program",
      logoUrl: "/greatlakes.png",
      start: "2014",
      end: "2015",
    },
  ],
  projects: [
    {
      title: "AskBenny",
      href: "https://askbenny.ca/",
      dates: "January 2025 - Present",
      active: true,
      description:
        "AI answering service for your Canadian business calls. 10x better than voicemail. 10x cheaper than an answering service. Grow your business while benny answers your calls, helps set appointments, and sends you the messages.",
      technologies: ["Next.js", "Go", "PostgreSQL", "TailwindCSS", "Stripe"],
      links: [
        {
          type: "Website",
          href: "https://askbenny.ca/",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/askbenny",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "/askbenny.mp4",
    },
    {
      title: "Chyro",
      href: "https://chyro.io",
      dates: "October 2024 - Present",
      active: true,
      description:
        "Optimize your chiropractic practice with Chyro's all-in-one management software. Simplify administrative tasks, from patient care to billing, and manage every aspect of your clinic with ease.",
      technologies: [
        "React JS (Vite)",
        "Serverless",
        "Typescript",
        "DynamoDB",
        "Stripe",
        "TailwindCSS",
        "Shadcn UI",
      ],
      links: [
        {
          type: "Website",
          href: "https://chyro.io",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/chyro-io",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "/chyro.mp4",
    },
  ],
} as const;
