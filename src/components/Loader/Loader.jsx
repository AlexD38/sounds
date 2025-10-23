import { useContext, useEffect, useState } from 'react';
import './styles.css';
import { Context } from '../../context/context';

export const Loader = ({ perc, quote }) => {
  const { zenQuote } = useContext(Context);

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