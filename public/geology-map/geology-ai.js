(function () {
  "use strict";

  const MAX_IMAGES = 12;
  const MAX_TOTAL_BYTES = 3.8 * 1024 * 1024;

  let selectedImages = [];
  let latestAnalysis = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function numberOrNull(id) {
    const value = document.getElementById(id)?.value?.trim();

    if (!value) return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function createInterface() {
    const style = document.createElement("style");

    style.textContent = `
      #geo-ai-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 6000;
        background: rgba(0,0,0,.58);
        align-items: center;
        justify-content: center;
        padding: 14px;
      }

      #geo-ai-modal.open {
        display: flex;
      }

      #geo-ai-box {
        width: 760px;
        max-width: 100%;
        max-height: 94vh;
        overflow-y: auto;
        background: #fff;
        border-radius: 15px;
        padding: 18px;
        box-shadow: 0 10px 38px #0008;
      }

      #geo-ai-box h2 {
        margin: 0 0 6px;
      }

      .geo-ai-help {
        font-size: 12px;
        line-height: 1.45;
        color: #555;
        margin-bottom: 13px;
      }

      .geo-ai-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      .geo-ai-full {
        grid-column: 1 / -1;
      }

      #geo-ai-box input,
      #geo-ai-box select,
      #geo-ai-box textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 9px;
        border: 1px solid #bbb;
        border-radius: 8px;
        font: inherit;
      }

      #geo-ai-box textarea {
        resize: vertical;
      }

      .geo-ai-images {
        margin-top: 8px;
        padding: 10px;
        border: 1px solid #d4d4d4;
        border-radius: 9px;
        background: #fafafa;
      }

      #geo-ai-file-list {
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.5;
      }

      .geo-ai-actions {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }

      .geo-ai-actions button {
        flex: 1;
        padding: 10px;
      }

      #geo-ai-analyze {
        background: #087849;
      }

      #geo-ai-cancel {
        background: #666;
      }

      #geo-ai-message {
        margin-top: 11px;
        font-size: 13px;
        font-weight: bold;
      }

      #geo-ai-result {
        display: none;
        margin-top: 15px;
        border: 1px solid #a9cbdc;
        border-radius: 10px;
        background: #f4faff;
        padding: 12px;
        font-size: 13px;
        line-height: 1.5;
      }

      #geo-ai-result h3 {
        margin: 0 0 8px;
      }

      .geo-ai-zone {
        margin-top: 8px;
        padding: 8px;
        border: 1px solid #d3e0e8;
        border-radius: 8px;
        background: white;
      }

      @media (max-width: 700px) {
        .geo-ai-grid {
          grid-template-columns: 1fr;
        }

        .geo-ai-full {
          grid-column: auto;
        }

        .geo-ai-actions {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "geo-ai-modal";

    modal.innerHTML = `
      <div id="geo-ai-box">
        <h2>Ново проучване и AI анализ</h2>

        <div class="geo-ai-help">
          Качи снимките от AIDU или ADMT и опиши какво е показала
          радиестезията. Координатите не са задължителни и могат да
          се добавят по-късно.
        </div>

        <div class="geo-ai-grid">
          <div class="geo-ai-full">
            <input
              id="geo-ai-title"
              placeholder="Име на проучването, например Боровец – Цветанка *"
            >
          </div>

          <div>
            <input
              id="geo-ai-locality"
              placeholder="Населено място *"
            >
          </div>

          <div>
            <input
              id="geo-ai-municipality"
              placeholder="Община"
            >
          </div>

          <div>
            <input
              id="geo-ai-district"
              placeholder="Област"
            >
          </div>

          <div>
            <input
              id="geo-ai-date"
              type="date"
            >
          </div>

          <div>
            <select id="geo-ai-equipment">
              <option value="AIDU">AIDU</option>
              <option value="ADMT">ADMT</option>
              <option value="AIDU + радиестезия">
                AIDU + радиестезия
              </option>
              <option value="ADMT + радиестезия">
                ADMT + радиестезия
              </option>
              <option value="Друг апарат">Друг апарат</option>
            </select>
          </div>

          <div>
            <select id="geo-ai-survey-type">
              <option value="Подземни води">
                Подземни води
              </option>
              <option value="Минерална вода">
                Минерална вода
              </option>
              <option value="Комбинирано">
                Комбинирано проучване
              </option>
              <option value="Контролно замерване">
                Контролно замерване
              </option>
            </select>
          </div>

          <div>
            <select id="geo-ai-water-type">
              <option value="Студена вода">Студена вода</option>
              <option value="Минерална вода">Минерална вода</option>
              <option value="Термална вода">Термална вода</option>
              <option value="Неуточнена">Неуточнена</option>
            </select>
          </div>

          <div>
            <input
              id="geo-ai-latitude"
              type="number"
              step="0.0000001"
              placeholder="Ширина – незадължително"
            >
          </div>

          <div>
            <input
              id="geo-ai-longitude"
              type="number"
              step="0.0000001"
              placeholder="Дължина – незадължително"
            >
          </div>

          <div class="geo-ai-full">
            <textarea
              id="geo-ai-dowsing"
              rows="4"
              placeholder="Какво е посочила радиестезията – точки, дълбочини, тип вода, предполагаема жила или разлом"
            ></textarea>
          </div>

          <div class="geo-ai-full">
            <textarea
              id="geo-ai-notes"
              rows="3"
              placeholder="Допълнителни теренни бележки – разстояние между точките, наклон, насип, твърди скали и други"
            ></textarea>
          </div>

          <div class="geo-ai-full geo-ai-images">
            <b>Снимки от замерването</b>

            <input
              id="geo-ai-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style="margin-top:8px"
            >

            <div class="geo-ai-help" style="margin:7px 0 0">
              До 12 снимки. Те се намаляват автоматично преди анализа.
            </div>

            <div id="geo-ai-file-list"></div>
          </div>
        </div>

        <div class="geo-ai-actions">
          <button
            type="button"
            id="geo-ai-cancel"
          >
            Затвори
          </button>

          <button
            type="button"
            id="geo-ai-analyze"
          >
            Анализирай и запази
          </button>
        </div>

        <div id="geo-ai-message"></div>
        <div id="geo-ai-result"></div>
      </div>
    `;

    document.body.appendChild(modal);

    const panel = document.querySelector(".panel");
    const analysisBox = document.querySelector(".analysisbox");

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "＋ Ново проучване и AI анализ";
    button.style.marginTop = "10px";
    button.style.background = "#087849";
    button.addEventListener("click", openForm);

    if (analysisBox) {
      analysisBox.insertAdjacentElement("beforebegin", button);
    } else if (panel) {
      panel.appendChild(button);
    }

    document
      .getElementById("geo-ai-cancel")
      .addEventListener("click", closeForm);

    document
      .getElementById("geo-ai-analyze")
      .addEventListener("click", analyzeSurvey);

    document
      .getElementById("geo-ai-images")
      .addEventListener("change", handleFileSelection);

    document
      .getElementById("geo-ai-date")
      .value = new Date().toISOString().slice(0, 10);
  }

  function openForm() {
    document
      .getElementById("geo-ai-modal")
      .classList.add("open");
  }

  function closeForm() {
    document
      .getElementById("geo-ai-modal")
      .classList.remove("open");
  }

  function handleFileSelection(event) {
    selectedImages = Array.from(event.target.files || [])
      .slice(0, MAX_IMAGES);

    const list = document.getElementById("geo-ai-file-list");

    if (!selectedImages.length) {
      list.textContent = "Няма избрани снимки.";
      return;
    }

    list.innerHTML = selectedImages
      .map(
        (file, index) =>
          `${index + 1}. ${escapeHtml(file.name)}`
      )
      .join("<br>");
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = function () {
        URL.revokeObjectURL(objectUrl);

        const maxDimension = 1500;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Снимката не може да бъде обработена."));
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error("Снимката не може да бъде компресирана."));
              return;
            }

            resolve(
              new File(
                [blob],
                file.name.replace(/\.[^.]+$/, "") + ".jpg",
                { type: "image/jpeg" }
              )
            );
          },
          "image/jpeg",
          0.76
        );
      };

      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Неуспешно зареждане на ${file.name}`));
      };

      image.src = objectUrl;
    });
  }

  function buildMapContext(latitude, longitude, locality) {
    if (latitude == null || longitude == null) {
      return (
        `Няма точни координати. Проучването е в района на ` +
        `${locality}. Картографската съпоставка трябва да бъде ` +
        `определена като ориентировъчна и районна.`
      );
    }

    return (
      `Координати на проучването: ${latitude}, ${longitude}. ` +
      `Точката може да бъде сравнена с видимите в картата ` +
      `водни тела, известни съоръжения и активни разломи.`
    );
  }

  async function waitForSupabase() {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (window.geologySupabase) {
        return window.geologySupabase;
      }

      await new Promise(resolve => setTimeout(resolve, 250));
    }

    throw new Error("Няма връзка с базата данни.");
  }

  function renderAnalysis(analysis) {
    const container = document.getElementById("geo-ai-result");

    const zones = Array.isArray(analysis.candidateZones)
      ? analysis.candidateZones
      : [];

    const observations = Array.isArray(analysis.deviceObservations)
      ? analysis.deviceObservations
      : [];

    const limitations = Array.isArray(analysis.limitations)
      ? analysis.limitations
      : [];

    container.innerHTML = `
      <h3>Резултат от AI анализа</h3>

      <b>Обобщение:</b><br>
      ${escapeHtml(analysis.summary || "Няма обобщение.")}

      <hr>

      <b>Наблюдения от апарата:</b>
      <ul>
        ${
          observations.length
            ? observations
                .map(item => `<li>${escapeHtml(item)}</li>`)
                .join("")
            : "<li>Няма достатъчно данни.</li>"
        }
      </ul>

      <b>Съпоставка с радиестезията:</b><br>
      ${escapeHtml(
        analysis.dowsingComparison?.agreement ||
        "не може да се потвърди"
      )}<br>
      ${escapeHtml(
        analysis.dowsingComparison?.details || ""
      )}

      <hr>

      <b>Съпоставка с картата:</b><br>
      Надеждност:
      ${escapeHtml(
        analysis.mapComparison?.confidence || "ниска"
      )}<br>
      ${escapeHtml(
        analysis.mapComparison?.details || ""
      )}

      <hr>

      <b>Перспективни зони:</b>

      ${
        zones.length
          ? zones.map(zone => `
              <div class="geo-ai-zone">
                <b>${escapeHtml(zone.point || "Неуточнена зона")}</b><br>
                Перспектива:
                ${escapeHtml(zone.perspective || "неуточнена")}<br>
                Дълбочина:
                ${escapeHtml(zone.possibleDepthFromM ?? "?")} –
                ${escapeHtml(zone.possibleDepthToM ?? "?")} m<br>
                ${escapeHtml(zone.reasoning || "")}
                ${
                  zone.alternativeExplanation
                    ? `<br><i>Алтернативно обяснение:
                       ${escapeHtml(zone.alternativeExplanation)}</i>`
                    : ""
                }
              </div>
            `).join("")
          : "<div class='geo-ai-zone'>Няма достатъчно данни за отделяне на зона.</div>"
      }

      <hr>

      <b>Препоръчана точка:</b><br>
      ${escapeHtml(analysis.recommendedPoint || "Недостатъчно данни")}

      <br><br>

      <b>Препоръчителна дълбочина:</b><br>
      ${escapeHtml(analysis.recommendedDepth?.fromM ?? "?")} –
      ${escapeHtml(analysis.recommendedDepth?.toM ?? "?")} m,
      надеждност:
      ${escapeHtml(analysis.recommendedDepth?.confidence || "ниска")}

      <hr>

      <b>Кратък текст за клиента:</b><br>
      ${escapeHtml(analysis.clientText || "")}

      <hr>

      <b>Ограничения:</b>
      <ul>
        ${
          limitations.length
            ? limitations
                .map(item => `<li>${escapeHtml(item)}</li>`)
                .join("")
            : "<li>Анализът е предварителен.</li>"
        }
      </ul>
    `;

    container.style.display = "block";
  }

  async function saveSurveyRecord(values, analysis) {
    const client = await waitForSupabase();

    const record = {
      title: values.title,
      locality: values.locality,
      municipality: values.municipality || null,
      district: values.district || null,
      latitude: values.latitude,
      longitude: values.longitude,
      survey_date: values.surveyDate || null,
      equipment: values.equipment || null,
      survey_type: values.surveyType || null,
      water_type: values.waterType || null,
      recommended_depth_from_m:
        analysis.recommendedDepth?.fromM ?? null,
      recommended_depth_to_m:
        analysis.recommendedDepth?.toM ?? null,
      recommended_point:
        analysis.recommendedPoint || null,
      status: "analyzed",
      notes: values.notes || null,
      dowsing_notes: values.dowsingNotes || null,
      ai_analysis: JSON.stringify(analysis),
      is_public: false
    };

    const result = await client
      .from("surveys")
      .insert(record)
      .select()
      .single();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async function analyzeSurvey() {
    const message = document.getElementById("geo-ai-message");
    const button = document.getElementById("geo-ai-analyze");

    const values = {
      title: document.getElementById("geo-ai-title").value.trim(),
      locality: document.getElementById("geo-ai-locality").value.trim(),
      municipality:
        document.getElementById("geo-ai-municipality").value.trim(),
      district:
        document.getElementById("geo-ai-district").value.trim(),
      surveyDate:
        document.getElementById("geo-ai-date").value,
      equipment:
        document.getElementById("geo-ai-equipment").value,
      surveyType:
        document.getElementById("geo-ai-survey-type").value,
      waterType:
        document.getElementById("geo-ai-water-type").value,
      dowsingNotes:
        document.getElementById("geo-ai-dowsing").value.trim(),
      notes:
        document.getElementById("geo-ai-notes").value.trim(),
      latitude: numberOrNull("geo-ai-latitude"),
      longitude: numberOrNull("geo-ai-longitude")
    };

    if (!values.title || !values.locality) {
      message.style.color = "#b00020";
      message.textContent =
        "Попълни име на проучването и населено място.";
      return;
    }

    if (!selectedImages.length) {
      message.style.color = "#b00020";
      message.textContent =
        "Качи поне една снимка от замерването.";
      return;
    }

    button.disabled = true;
    message.style.color = "#555";
    message.textContent =
      "Подготовка на снимките и AI анализ. Изчакай...";

    try {
      const compressedImages = [];

      for (const image of selectedImages) {
        compressedImages.push(await compressImage(image));
      }

      const totalSize = compressedImages.reduce(
        (sum, file) => sum + file.size,
        0
      );

      if (totalSize > MAX_TOTAL_BYTES) {
        throw new Error(
          "Снимките остават прекалено големи. Качи ги на две части или използвай екранни снимки."
        );
      }

      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("locality", values.locality);
      formData.append("municipality", values.municipality);
      formData.append("district", values.district);
      formData.append("equipment", values.equipment);
      formData.append("surveyType", values.surveyType);
      formData.append("waterType", values.waterType);
      formData.append("dowsingNotes", values.dowsingNotes);
      formData.append("notes", values.notes);

      formData.append(
        "mapContext",
        buildMapContext(
          values.latitude,
          values.longitude,
          values.locality
        )
      );

      compressedImages.forEach(file => {
        formData.append("images", file);
      });

      const response = await fetch("/api/geology-analyze", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || "AI анализът не беше успешен."
        );
      }

      latestAnalysis = payload.analysis;
      renderAnalysis(latestAnalysis);

      message.textContent =
        "AI анализът е готов. Записване в базата...";

      await saveSurveyRecord(values, latestAnalysis);

      message.style.color = "#087849";
      message.textContent =
        "Анализът и проучването са записани успешно.";
    } catch (error) {
      console.error("[Geology AI]", error);

      message.style.color = "#b00020";
      message.textContent =
        "Грешка: " +
        (error?.message || String(error));
    } finally {
      button.disabled = false;
    }
  }

  function start() {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        createInterface
      );
    } else {
      createInterface();
    }
  }

  start();
})();
