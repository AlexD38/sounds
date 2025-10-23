import { useEffect, useState } from 'react';
import './styles.css';

export const Loader = ({ perc, quote }) => {
  const [zenQuote, setZenQuote] = useState(null);

  useEffect(() => {
    if (!quote) return; // n'appelle l'API que si 'quote' est vrai

    const fetchQuote = async () => {
      try {
        const response = await fetch(
          'https://quoteslate.vercel.app/api/quotes/random'
        );
        const data = await response.json();
        setZenQuote(data);
      } catch (error) {
        console.error('Erreur de chargement de la citation :', error);
      }
    };

    fetchQuote();
  }, [quote]); // <-- dépendance pour relancer si 'quote' change

  return (
    <>
      {perc < 100 && (
        <div className="loader-container">
          <span className="loader"></span>
          {quote && zenQuote && (
            <div className="quote-container">
              <p className="quote">“{zenQuote.quote}”</p>
              <p className="author">- {zenQuote.author}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
