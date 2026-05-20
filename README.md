# Wheel of Food 🍽️

A fun, interactive web application to help you decide where to eat! Add your favorite restaurants, spin the wheel, and let fate decide your next meal. 

## Features
- **Interactive Wheel:** Spin the wheel to randomly select a restaurant.
- **Restaurant Management:** Add your favorite food spots to the list.
- **Selection History:** Keep track of previously picked restaurants. Picked items receive a malus (reduced probability) to ensure variety!
- **Admin Login:** Secured controls so only authorized users can modify the restaurant list or clear the history.

## Tech Stack
- **Frontend:** Vanilla JavaScript, HTML5 Canvas, CSS (Vite for bundling)
- **Backend/Database:** Supabase (PostgreSQL)
- **Styling:** Custom CSS with modern typography (Outfit font)

## Setup & Local Development

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and Anon Key.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Building for Production
To build the application for production, run:
```bash
npm run build
```

## License
This project is licensed under the [MIT License](LICENSE).
