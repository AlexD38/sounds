import {
  addWindLayer,
  MAX_WIND_LAYERS,
  removeWindLayer,
  WIND_GLOBAL_SLIDERS,
  WIND_LAYER_SLIDERS,
} from '../../utils/windCreator';

/**
 * UI Wind Creator : 1 piste par défaut, ajout jusqu'à 3.
 */
export function WindCreatorSliders({ params, onChange }) {
  const layers = params.layers || [];

  const updateGlobal = (key, rawValue) => {
    onChange({ ...params, [key]: parseFloat(rawValue) }, key);
  };

  const updateLayer = (layerId, key, rawValue) => {
    const value =
      typeof rawValue === 'boolean' ? rawValue : parseFloat(rawValue);
    onChange(
      {
        ...params,
        layers: layers.map(layer =>
          layer.id === layerId ? { ...layer, [key]: value } : layer
        ),
      },
      `${layerId}.${key}`
    );
  };

  const toggleLayer = layerId => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    updateLayer(layerId, 'enabled', !layer.enabled);
  };

  const handleAddLayer = () => {
    onChange(addWindLayer(params), 'addLayer');
  };

  const handleRemoveLayer = layerId => {
    onChange(removeWindLayer(params, layerId), 'removeLayer');
  };

  return (
    <div className="active-player-card__wind-params">
      {layers.map((layer, index) => {
        const label = `Track ${index + 1}`;
        const enabled = Boolean(layer.enabled);

        return (
          <div
            key={layer.id}
            className={`active-player-card__wind-layer-block${
              enabled ? '' : ' is-dimmed'
            }`}
          >
            <div className="active-player-card__wind-layer-header">
              <button
                type="button"
                className={`active-player-card__wind-layer-btn${
                  enabled ? ' is-on' : ''
                }`}
                aria-pressed={enabled}
                aria-label={`${label} ${enabled ? 'on' : 'off'}`}
                title={`${label}: ${enabled ? 'on' : 'off'}`}
                onClick={() => toggleLayer(layer.id)}
              >
                <i className="fa-solid fa-feather" aria-hidden="true" />
                <span>{label}</span>
              </button>

              {layers.length > 1 && (
                <button
                  type="button"
                  className="active-player-card__wind-remove"
                  aria-label={`Remove ${label}`}
                  title={`Remove ${label}`}
                  onClick={() => handleRemoveLayer(layer.id)}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              )}
            </div>

            {WIND_LAYER_SLIDERS.map(slider => (
              <label key={slider.key} className="active-player-card__row">
                <span
                  className="active-player-card__row-label"
                  title={`${slider.label}: ${layer[slider.key]}`}
                >
                  <i
                    className={`fa-solid fa-${slider.icon}`}
                    aria-hidden="true"
                  />
                </span>
                <input
                  className="active-player-card__range"
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={layer[slider.key]}
                  disabled={!enabled}
                  onChange={e =>
                    updateLayer(layer.id, slider.key, e.target.value)
                  }
                  aria-label={`${label} ${slider.label}`}
                />
                <span className="active-player-card__wind-value">
                  {formatParamValue(layer[slider.key], slider.step)}
                </span>
              </label>
            ))}
          </div>
        );
      })}

      {layers.length < MAX_WIND_LAYERS && (
        <button
          type="button"
          className="active-player-card__wind-add"
          onClick={handleAddLayer}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add track ({layers.length}/{MAX_WIND_LAYERS})
        </button>
      )}

      {WIND_GLOBAL_SLIDERS.length > 0 && (
        <div className="active-player-card__wind-global">
          {WIND_GLOBAL_SLIDERS.map(slider => (
            <label key={slider.key} className="active-player-card__row">
              <span
                className="active-player-card__row-label"
                title={`${slider.label}: ${params[slider.key]}`}
              >
                <i className={`fa-solid fa-${slider.icon}`} aria-hidden="true" />
              </span>
              <input
                className="active-player-card__range"
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={params[slider.key]}
                onChange={e => updateGlobal(slider.key, e.target.value)}
                aria-label={slider.label}
              />
              <span className="active-player-card__wind-value">
                {formatParamValue(params[slider.key], slider.step)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function formatParamValue(value, step) {
  if (step < 0.001) return Number(value).toFixed(4);
  if (step < 0.01) return Number(value).toFixed(3);
  if (step < 1) return Number(value).toFixed(2);
  return String(Math.round(value));
}
