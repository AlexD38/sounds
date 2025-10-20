import './styles.css';

export const Loader = ({ perc }) => {
  return (
    <>
      {perc < 100 && (
        <div className="loader-container">
          {/* <i className="fa-solid fa-spinner loader"></i> */}
          <span class="loader"></span>
          {/* <span> Loading sounds...{perc.toFixed(0)} %</span> */}
        </div>
      )}
    </>
  );
};
