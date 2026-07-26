(function () {
  "use strict";

  const BATCH_SIZE = 4;
  const MAX_IMAGES = 30;

  function value(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function numberOrNull(id) {
    const raw = value(id);

    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function escapeHtml(input) {
    return String(input ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = function () {
        URL.revokeObjectURL(objectUrl);

        const maxDimension = 1100;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(
          1,
          Math.round(image.width * scale)
        );
        canvas.height = Math.max(
          1,
          Math.round(image.height * scale)
        );

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
              reject(
                new Error("Снимката не може да бъде компресирана.")
              );
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
          0.62
        );
      };

      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error("Неуспешно зареждане на " + file.name)
        );
      };

      image.src = objectUrl;
    });
  }

  function splitIntoBatches(items, size) {
    const batches = [];

    for (let index = 0; index < items.length; index += size) {
      batches.push(items.slice(index, index + size));
    }

    return batches;
  }

  function buildMapContext(latitude, longitude, locality) {
    if (latitude == null || longitude == null) {
      return (
        "Няма точни координати. Проучването е в района на " +
        locality +
        ". Картографската съпоставка е ориентировъчна."
      );
    }

    return (
      "Координати на проучването: " +
      latitude +
      ", " +
      longitude +
      "."
    );
  }

  async function parseResponse(response) {
    const text = await response.text();

    let payload;

    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        "Сървърът върна грешка: " + text.slice(0, 250)
      );
    }

    if (!response.ok || !payload.success) {
      throw new Error(
        payload.error || "AI анализът не беше успешен."
      );
    }

    return payload;
  }

  async function analyzeBatch(batch, values, batchNumber, totalBatches) {
    const formData = new FormData();

    formData.append(
      "title",
      values.title +
        " — автоматична група " +
        batchNumber +
        " от " +
        totalBatches
    );

    formData.append("locality", values.locality);
    formData.append("municipality", values.municipality);
    formData.append("district", values.district);
    formData.append("equipment", values.equipment);
    formData.append("surveyType", values.surveyType);
    formData.append("waterType", values.waterType);
    formData.append("dowsingNotes", values.dowsingNotes);

    formData.append(
      "notes",
      values.notes +
        "\n\nТова е автоматично отделена група изображения. " +
        "Не приемай, че редът им съответства на реда на точките."
    );

    formData.append("mapContext", values.mapContext);

    batch.forEach(file => {
      formData.append("images", file);
    });

    const response = await fetch("/api/geology-analyze", {
      method: "POST",
      body: formData,
    });

    const payload = await parseResponse(response);
    return payload.analysis;
  }

  async function synthesize(values, partialAnalyses) {
    const response = await fetch("/api/geology-synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: values.title,
        locality: values.locality,
        dowsingNotes: values.dowsingNotes,
        notes: values.notes,
        mapContext: values.mapContext,
        partialAnalyses,
      }),
    });

    const payload = await parseResponse(response);
    return payload.analysis;
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

  async function saveFinalAnalysis(values, analysis) {
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
      is_public: false,
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

  function renderFinalAnalysis(analysis) {
    const container = document.getElementById("geo-ai-result");

    const zones = Array.isArray(analysis.candidateZones)
      ? analysis.candidateZones
      : [];

    const observations = Array.isArray(
      analysis.deviceObservations
    )
      ? analysis.deviceObservations
      : [];

    const limitations = Array.isArray(analysis.limitations)
      ? analysis.limitations
      : [];

    container.innerHTML = `
      <h3>Общ анализ на всички снимки</h3>

      <b>Обобщение:</b><br>
      ${escapeHtml(analysis.summary || "")}

      <hr>

      <b>Наблюдения от апарата:</b>
      <ul>
        ${observations
          .map(item => `<li>${escapeHtml(item)}</li>`)
          .join("")}
      </ul>

      <b>Съпоставка с радиестезията:</b><br>
      ${escapeHtml(
        analysis.dowsingComparison?.agreement || ""
      )}<br>
      ${escapeHtml(
        analysis.dowsingComparison?.details || ""
      )}

      <hr>

      <b>Перспективни зони:</b>

      ${
        zones.length
          ? zones
              .map(
                zone => `
                  <div class="geo-ai-zone">
                    <b>${escapeHtml(
                      zone.point || "Неуточнена зона"
                    )}</b><br>
                    Перспектива:
                    ${escapeHtml(zone.perspective || "")}<br>
                    Дълбочина:
                    ${escapeHtml(
                      zone.possibleDepthFromM ?? "?"
                    )} –
                    ${escapeHtml(
                      zone.possibleDepthToM ?? "?"
                    )} m<br>
                    ${escapeHtml(zone.reasoning || "")}
                  </div>
                `
              )
              .join("")
          : "Няма достатъчно данни."
      }

      <hr>

      <b>Препоръчана точка:</b><br>
      ${escapeHtml(
        analysis.recommendedPoint || "Недостатъчно данни"
      )}

      <br><br>

      <b>Резервна точка:</b><br>
      ${escapeHtml(
        analysis.reservePoint || "Недостатъчно данни"
      )}

      <br><br>

      <b>Препоръчителна дълбочина:</b><br>
      ${escapeHtml(
        analysis.recommendedDepth?.fromM ?? "?"
      )} –
      ${escapeHtml(
        analysis.recommendedDepth?.toM ?? "?"
      )} m

      <hr>

      <b>Текст за клиента:</b><br>
      ${escapeHtml(analysis.clientText || "")}

      <hr>

      <b>Ограничения:</b>
      <ul>
        ${limitations
          .map(item => `<li>${escapeHtml(item)}</li>`)
          .join("")}
      </ul>
    `;

    container.style.display = "block";
  }

  async function runMultiBatchAnalysis(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = document.getElementById("geo-ai-analyze");
    const message = document.getElementById("geo-ai-message");
    const fileInput = document.getElementById("geo-ai-images");

    const originalFiles = Array.from(fileInput?.files || [])
      .slice(0, MAX_IMAGES);

    const values = {
      title: value("geo-ai-title"),
      locality: value("geo-ai-locality"),
      municipality: value("geo-ai-municipality"),
      district: value("geo-ai-district"),
      surveyDate: value("geo-ai-date"),
      equipment: value("geo-ai-equipment"),
      surveyType: value("geo-ai-survey-type"),
      waterType: value("geo-ai-water-type"),
      dowsingNotes: value("geo-ai-dowsing"),
      notes: value("geo-ai-notes"),
      latitude: numberOrNull("geo-ai-latitude"),
      longitude: numberOrNull("geo-ai-longitude"),
    };

    values.mapContext = buildMapContext(
      values.latitude,
      values.longitude,
      values.locality
    );

    if (!values.title || !values.locality) {
      message.style.color = "#b00020";
      message.textContent =
        "Попълни име на проучването и населено място.";
      return;
    }

    if (!originalFiles.length) {
      message.style.color = "#b00020";
      message.textContent =
        "Качи поне една снимка от замерването.";
      return;
    }

    button.disabled = true;
    message.style.color = "#555";
    message.textContent =
      "Подготовка на всички снимки...";

    try {
      const compressed = [];

      for (let index = 0; index < originalFiles.length; index++) {
        message.textContent =
          "Подготовка на снимка " +
          (index + 1) +
          " от " +
          originalFiles.length +
          "...";

        compressed.push(
          await compressImage(originalFiles[index])
        );
      }

      const batches = splitIntoBatches(
        compressed,
        BATCH_SIZE
      );

      const partialAnalyses = [];

      for (
        let batchIndex = 0;
        batchIndex < batches.length;
        batchIndex++
      ) {
        message.textContent =
          "Анализ на група " +
          (batchIndex + 1) +
          " от " +
          batches.length +
          "...";

        const partial = await analyzeBatch(
          batches[batchIndex],
          values,
          batchIndex + 1,
          batches.length
        );

        partialAnalyses.push(partial);
      }

      message.textContent =
        "Обединяване на всички резултати...";

      const finalAnalysis = await synthesize(
        values,
        partialAnalyses
      );

      renderFinalAnalysis(finalAnalysis);

      message.textContent =
        "Записване на общия анализ...";

      await saveFinalAnalysis(values, finalAnalysis);

      message.style.color = "#087849";
      message.textContent =
        "Всички " +
        originalFiles.length +
        " снимки са анализирани. " +
        "Общият резултат е записан успешно.";
    } catch (error) {
      console.error("[Multi-batch geology AI]", error);

      message.style.color = "#b00020";
      message.textContent =
        "Грешка: " +
        (error?.message || String(error));
    } finally {
      button.disabled = false;
    }
  }

  function attachOverride() {
    const button = document.getElementById("geo-ai-analyze");

    if (!button) {
      setTimeout(attachOverride, 300);
      return;
    }

    if (button.dataset.multiBatchAttached === "true") {
      return;
    }

    button.dataset.multiBatchAttached = "true";

    button.addEventListener(
      "click",
      runMultiBatchAnalysis,
      true
    );

    const help = document.querySelector(
      "#geo-ai-box .geo-ai-help"
    );

    if (help) {
      help.innerHTML =
        "Качи всички снимки от замерването наведнъж. " +
        "Не е необходимо да ги подреждаш или преименуваш. " +
        "Системата ще ги анализира автоматично на групи и " +
        "ще изготви един общ резултат.";
    }
  }

  attachOverride();
})();
