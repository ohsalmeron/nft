# SCSS Architecture

This directory contains the modular SCSS structure for the NFT gallery frontend.

## File Structure

```
styles/
├── _variables.scss    # Design system variables and tokens
├── _mixins.scss       # Reusable SCSS mixins and utilities
├── _globals.scss      # Global styles, resets, and utilities
├── _animations.scss   # Keyframe animations and animation classes
├── _layout.scss       # Layout components and grid systems
├── _components.scss   # Component-specific styles (NFT cards, modals)
├── _banner.scss       # Collection banner component styles
└── README.md          # This documentation
```

## File Descriptions

### `_variables.scss`
- CSS custom properties (design tokens)
- Color palette and gradients
- Spacing, typography, and sizing scales
- Transitions and animations
- Z-index management

### `_mixins.scss`
- Glassmorphism effects (`@mixin glass`, `@mixin glass-card`)
- Gradient borders (`@mixin gradient-border`)
- Loading spinners (`@mixin loading-spinner`)
- Responsive breakpoints (`@mixin mobile`, `@mixin tablet`, etc.)
- Text utilities (`@mixin text-truncate`, `@mixin text-gradient`)

### `_globals.scss`
- Global resets and base styles
- Body and HTML styling
- Animated background gradients
- Custom scrollbar styling
- Selection styles
- Utility classes

### `_animations.scss`
- Keyframe animations (`@keyframes spin`, `@keyframes cardEntrance`, etc.)
- Animation utility classes
- Loading spinner component

### `_layout.scss`
- App container and main content layout
- Responsive NFT grid system
- Loading states and containers
- Scroll sentinel and pagination

### `_components.scss`
- NFT card component styles
- NFT modal component styles
- Trait display and grid layouts
- Image loading states

### `_banner.scss`
- Collection banner component
- Logo and branding elements
- Social links and metadata
- Statistics and standards display

## Usage

The main `index.scss` file imports all these modules in the correct order:

```scss
@import 'styles/variables';
@import 'styles/mixins';
@import 'styles/globals';
@import 'styles/animations';
@import 'styles/layout';
@import 'styles/components';
@import 'styles/banner';
```

## Benefits

1. **Modularity**: Each file has a single responsibility
2. **Maintainability**: Easy to find and modify specific styles
3. **Reusability**: Mixins and variables can be shared across components
4. **Performance**: Only imports what's needed
5. **Scalability**: Easy to add new components or modify existing ones

## Best Practices

- Use mixins for repeated patterns (glassmorphism, gradients)
- Keep variables in `_variables.scss` for consistency
- Use responsive mixins for breakpoint management
- Follow BEM naming conventions for component classes
- Keep animations separate for better performance 