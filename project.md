# FA25-TechA Project Overview

## Project Summary

**FA25-TechA** is a graduate-level course website for Pratt Institute's Graduate Communications Design program, specifically for the course "Graduate Studio: Technology A" (DES 720A). The site serves as both a course information hub and a showcase platform for student projects involving emerging technologies, creative coding, and interactive media.

## Technology Stack

### Core Framework
- **Astro 5.11.1** - Modern static site generator with island architecture
- **TypeScript** - Type-safe JavaScript development
- **MDX Support** - Markdown with JSX components for rich content

### Styling & UI
- **Tailwind CSS 4.1.11** - Utility-first CSS framework with Vite integration
- **Custom CSS** - Specialized styles for components and global design
- **Geist & Source Serif 4** - Typography stack (sans-serif for headings, serif for body text)

### Interactive Components
- **Swiper 11.2.10** - Modern touch slider/carousel library
- **p5.js 2.0.3** - Creative coding library for generative graphics
- **p5.brush.js** - Custom brush library for p5.js (minified version included)

### Development Tools
- **Vite** - Build tool and development server
- **PostCSS 8.5.6** - CSS processing pipeline
- **Prettier 3.6.2** - Code formatting with Astro, CSS, and Tailwind plugins

## Architecture Overview

### Project Structure

```
FA25-TechA/
├── src/                    # Source code directory
│   ├── assets/            # Static assets (images, SVGs)
│   ├── components/        # Reusable Astro components
│   ├── data/              # JSON data files
│   ├── doc/               # Course documentation pages
│   ├── layouts/           # Page layout templates
│   ├── pages/             # Route definitions
│   ├── scripts/           # Build and utility scripts
│   └── styles/            # CSS modules and global styles
├── public/                # Static public assets
├── .astro/                # Astro-generated types and cache
└── Configuration files    # package.json, astro.config.mjs, etc.
```

### Key Components

#### Layout System
- **Layout.astro** - Base HTML structure with font loading and meta tags
- **Responsive design** with mobile-first approach using Tailwind utilities

#### Core Components

1. **Nav.astro** - Site header with course title and navigation
2. **Sketch.astro** - p5.js container for interactive canvas elements
3. **Card.astro** - Expandable content cards with click interactions
4. **Accordion.astro** - Collapsible content sections with smooth animations
5. **Swiper.astro** - Touch-enabled carousel for content slides
6. **Footer.astro** - Site footer component

#### Data Management
- **projects-with-local-images.json** - Student project data with local image paths
- **Google Sheets integration** via OpenSheet API for data sourcing
- **Image download script** for processing Google Drive images

### Page Architecture

#### Homepage (`/`)
- **Modular content structure** using component composition
- **Course information sections**: Description, Community, Modules, Grading, Policies, Resources
- **Interactive elements**: Accordion for modules, Swiper for course description cards
- **p5.js integration** for creative visual elements

#### Work Page (`/work`)
- **Dynamic project showcase** using JSON data
- **Project cards** with images, descriptions, and p5.js editor links
- **Responsive image handling** with local file storage
- **Conditional content rendering** based on data availability

### Styling Architecture

#### Global Styles (`global.css`)
- **CSS Custom Properties** for design tokens (margins, padding, borders)
- **Tailwind CSS integration** with custom utilities
- **Typography system** with Geist (headings) and Source Serif 4 (body)
- **Gradient backgrounds** with noise texture overlay
- **Custom link animations** with gradient underlines

#### Component Styles
- **Modular CSS imports** for specific components
- **Card styles** with aspect ratio management and expand/collapse animations
- **Accordion animations** with height transitions and accessibility attributes
- **Swiper customization** with Tailwind utilities

### Interactive Features

#### p5.js Integration
- **Canvas container** with styled border and background
- **Background image integration** with CSS overlays
- **Brush library support** for creative drawing tools

#### Component Interactions
- **Card expansion** on click with dynamic height calculations
- **Accordion toggle** with smooth height transitions
- **Swiper carousel** with touch support and autoplay capabilities
- **Responsive navigation** with mobile-optimized layouts

### Data Pipeline

#### Image Processing Workflow
1. **Google Sheets** as primary data source
2. **Node.js script** (`download-images.js`) processes:
   - Fetches project data from OpenSheet API
   - Downloads images from Google Drive URLs
   - Converts URLs to local file paths
   - Organizes images by email/project structure
   - Generates updated JSON with local paths

#### File Organization
```
public/images/
├── {email}/
│   └── {project_name}/
│       ├── image_1.jpg
│       └── image_2.png
```

### Development Workflow

#### Build Process
- **Development server**: `npm run dev` (localhost:4321)
- **Production build**: `npm run build` (outputs to `./dist/`)
- **Preview build**: `npm run preview` for local production testing

#### Code Quality
- **Prettier configuration** with:
  - Astro plugin for component formatting
  - Tailwind CSS plugin for class ordering
  - CSS order plugin for consistent styling
- **TypeScript strict mode** for type safety
- **Path aliases** (`@/` → `src/`) for clean imports

### Accessibility Features

#### Semantic HTML
- **Proper heading structure** with hierarchical organization
- **ARIA attributes** for interactive components
- **Keyboard navigation** support for accordions and cards

#### Component Accessibility
- **Accordion buttons** with `aria-expanded` and `aria-hidden` attributes
- **Card interactions** with proper focus management
- **Link accessibility** with clear visual indicators

### Performance Considerations

#### Optimization Strategies
- **Static site generation** for fast loading
- **Image optimization** with local file serving
- **Component-based architecture** for code splitting
- **Tailwind CSS** for optimized CSS output

#### Asset Management
- **Local image storage** reduces external dependencies
- **Organized file structure** for efficient asset loading
- **Progressive enhancement** approach for interactive features

## Future Considerations

### Potential Enhancements
- **Image optimization pipeline** with compression and responsive formats
- **Advanced p5.js integrations** for more complex interactive elements
- **Student submission system** for direct project uploads
- **Real-time data synchronization** with Google Sheets
- **Enhanced accessibility** with more comprehensive ARIA support

### Technical Debt
- **Minified p5.brush.js** should be replaced with source version for maintainability
- **Inline scripts** in components could be extracted to separate files
- **Hardcoded values** in components could be moved to configuration files
- **Error handling** in data processing scripts could be more robust

## Conclusion

The FA25-TechA project represents a modern, well-architected web application that effectively combines educational content delivery with creative technology showcase capabilities. Its component-based architecture, modern tooling, and thoughtful design patterns make it both maintainable and extensible for future course iterations.