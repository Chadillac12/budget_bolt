# Getting Started with Budget Bolt

This guide will help you set up and run the Budget Bolt application for development or testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (v7 or later)
- [Git](https://git-scm.com/) (for version control)
- A code editor (e.g., [Visual Studio Code](https://code.visualstudio.com/))
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (for React Native development)

## Setup Instructions

### 1. Clone the Repositoryww

```bash
# Clone the repository
git clone https://github.com/yourusername/budget_bolt.git

# Navigate to the project directory
cd budget_bolt
```

### 2. Install Dependencies

```bash
# Install project dependencies
npm install
```

### 3. Start the Development Server

```bash
# Start the Expo development server
npm run dev
```

This will start the development server and provide you with options to run the application in different environments.

### 4. Running the Application

#### For Web (Windows)

After starting the development server, open your browser and navigate to:

```
http://localhost:19006
```

#### For iOS Simulator (if you have macOS and Xcode installed)

```bash
# Press 'i' in the terminal where the Expo server is running
# Or use the Expo Go app on your iOS device to scan the QR code
```

## Project Structure

The Budget Bolt project follows a structured organization:

- `/app` - Main application screens and navigation
- `/components` - Reusable UI components
- `/context` - React Context for state management
- `/types` - TypeScript type definitions
- `/utils` - Utility functions and helpers
- `/assets` - Static assets like images and fonts

Key files to understand:

- `app/(tabs)/_layout.tsx` - Main navigation structure
- `context/AppContext.tsx` - Global state management
- `package.json` - Project dependencies and scripts

## Development Workflow

1. **Understand the Requirements**: Review the original requirements in the project documentation.

2. **Explore the Codebase**: Familiarize yourself with the existing code structure and components.

3. **Run the Application**: Start the development server and explore the application's functionality.

4. **Make Changes**: Implement new features or fix issues based on the project roadmap.

5. **Test Your Changes**: Ensure your changes work as expected across different platforms.

6. **Commit Your Changes**: Use Git to commit your changes with descriptive commit messages.

## Next Steps

After setting up the project, you might want to:

1. Review the `Budget_Bolt_Review.md` file to understand the current state of the application.

2. Check `Budget_Bolt_Architecture_Diagram.md` for visual representations of the application architecture.

3. Follow the roadmap in `Budget_Bolt_Next_Steps.md` to contribute to the project's development.

## Common Issues and Solutions

### Issue: Dependencies Installation Fails

```bash
# Try clearing npm cache
npm cache clean --force

# Then reinstall dependencies
npm install
```

### Issue: Expo Server Won't Start

```bash
# Check if the port is already in use
# Try using a different port
npm run dev -- --port 19007
```

### Issue: Changes Not Reflecting

If your changes aren't showing up in the application:

1. Save all files
2. Refresh the browser (for web)
3. Restart the development server if needed

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions, please:

1. Check the existing documentation
2. Look for similar issues in the project's issue tracker
3. Create a new issue with a detailed description if needed