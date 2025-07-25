import React, { useState, useRef, useEffect, useContext } from 'react';
import './style.css';
import { Context } from '../../../context/context';
import { SearchThatSound } from '../../../utils/utils';
export default function SearchSound() {
  const [expanded, setExpanded] = useState(false);
  const [searchBtnDisplayed, setSearchBtnDisplayed] = useState(false);
  const inputRef = useRef(null);
  const { customSound, setCustomSound, setCurrentInput } = useContext(Context);

  const handleSearch = async () => {
    const query = inputRef.current.value;
    const { obj } = await SearchThatSound(query);

    setCurrentInput(query);
    setCustomSound(obj);
  };

  const handleExpand = () => {
    expanded ? setExpanded(false) : setExpanded(true);
  };
  const handleInput = () => {
    if (inputRef.current.value.length > 0) {
      setSearchBtnDisplayed(true);
    } else {
      setSearchBtnDisplayed(false);
    }
  };
  return (
    <div className="search-container">
      <input
        type="search"
        className={expanded ? 'search-bar search-expand' : 'search-bar'}
        placeholder="Search any sound here..."
        onClick={handleExpand}
        ref={inputRef}
        onChange={handleInput}
      />
      {searchBtnDisplayed && <button onClick={handleSearch}>Search !</button>}
    </div>
  );
}
