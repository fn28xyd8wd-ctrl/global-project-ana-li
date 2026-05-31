const githubPagesUrl = "REPLACE_WITH_YOUR_GITHUB_PAGES_URL";

const testDatasets = {
    uniform: [1.1, 1.6, 2.0, 2.5, 3.1, 3.4, 3.9, 4.3, 4.8, 5.2, 5.7, 6.1, 6.6, 7.0, 7.4, 7.8, 8.3, 8.7, 9.2, 9.6],
    triangular: [1.2, 2.0, 2.7, 3.1, 3.5, 3.9, 4.2, 4.5, 4.8, 5.0, 5.2, 5.4, 5.7, 6.0, 6.3, 6.8, 7.4, 8.2, 8.9, 9.5],
    normal: [41.8, 43.5, 44.2, 45.7, 46.1, 47.3, 48.0, 48.9, 49.4, 50.2, 50.7, 51.5, 52.1, 52.9, 53.8, 54.4, 55.2, 56.1, 57.4, 58.6]
};

function setGithubLink() {
    const link = document.getElementById("githubPagesLink");
    if (githubPagesUrl.startsWith("http")) {
        link.href = " https://fn28xyd8wd-ctrl.github.io/global-economics-project/";
        link.textContent = githubPagesUrl;
    }
}

function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    const ax = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * ax);
    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax));
    return sign * y;
}

function normalPDF(x, mean, sd) {
    return Math.exp(-0.5 * Math.pow((x - mean) / sd, 2)) / (sd * Math.sqrt(2 * Math.PI));
}

function normalCDF(x, mean, sd) {
    return 0.5 * (1 + erf((x - mean) / (sd * Math.sqrt(2))));
}

function uniformPDF(x, a, b) {
    return x >= a && x <= b ? 1 / (b - a) : 0;
}

function triangularPDF(x, a, c, b) {
    if (x < a || x > b) return 0;
    if (x <= c) return (2 * (x - a)) / ((b - a) * (c - a));
    return (2 * (b - x)) / ((b - a) * (b - c));
}

function linearPDF(x, a, b, direction) {
    if (x < a || x > b) return 0;
    const width = b - a;
    if (direction === "increasing") return (2 * (x - a)) / (width * width);
    return (2 * (b - x)) / (width * width);
}

function piecewisePDF(x, a, m, b, h1) {
    const h2 = (1 - (m - a) * h1) / (b - m);
    if (x < a || x > b) return 0;
    return x <= m ? h1 : h2;
}

function linspace(start, end, n) {
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(start + (i / (n - 1)) * (end - start));
    return xs;
}

function updateInputs() {
    const d = document.getElementById("distribution").value;
    const box = document.getElementById("parameterInputs");

    if (d === "uniform") {
        box.innerHTML = `
            <label>Lower endpoint a<input id="a" type="number" value="0" step="any"></label>
            <label>Upper endpoint b<input id="b" type="number" value="10" step="any"></label>
        `;
    } else if (d === "triangular") {
        box.innerHTML = `
            <label>Lower endpoint a<input id="a" type="number" value="0" step="any"></label>
            <label>Upper endpoint b<input id="b" type="number" value="10" step="any"></label>
            <label>Mode c<input id="c" type="number" value="5" step="any"></label>
        `;
    } else if (d === "linear") {
        box.innerHTML = `
            <label>Lower endpoint a<input id="a" type="number" value="0" step="any"></label>
            <label>Upper endpoint b<input id="b" type="number" value="10" step="any"></label>
            <label>Direction
                <select id="linearDirection">
                    <option value="increasing">Increasing</option>
                    <option value="decreasing">Decreasing</option>
                </select>
            </label>
        `;
    } else if (d === "piecewise") {
        box.innerHTML = `
            <label>Lower endpoint a<input id="a" type="number" value="0" step="any"></label>
            <label>Split point m<input id="m" type="number" value="4" step="any"></label>
            <label>Upper endpoint b<input id="b" type="number" value="10" step="any"></label>
            <label>First height h1<input id="h1" type="number" value="0.15" step="any"></label>
        `;
    } else {
        box.innerHTML = `
            <label>Mean mu<input id="mean" type="number" value="0" step="any"></label>
            <label>Standard deviation sigma<input id="sd" type="number" value="1" step="any"></label>
        `;
    }
}

function updateBounds() {
    const type = document.getElementById("probabilityType").value;
    const box = document.getElementById("boundInputs");
    if (type === "between") {
        box.innerHTML = `
            <label>Lower bound<input id="lowerBound" type="number" value="2" step="any"></label>
            <label>Upper bound<input id="upperBound" type="number" value="6" step="any"></label>
        `;
    } else {
        box.innerHTML = `<label>Point<input id="point" type="number" value="4" step="any"></label>`;
    }
}

function getRegionBounds() {
    const type = document.getElementById("probabilityType").value;
    if (type === "between") {
        const left = Number(document.getElementById("lowerBound").value);
        const right = Number(document.getElementById("upperBound").value);
        return { left: Math.min(left, right), right: Math.max(left, right) };
    }
    const point = Number(document.getElementById("point").value);
    return type === "below" ? { left: -Infinity, right: point } : { left: point, right: Infinity };
}

function makeSimulationModel() {
    const d = document.getElementById("distribution").value;

    if (d === "uniform") {
        const a = Number(document.getElementById("a").value);
        const b = Number(document.getElementById("b").value);
        if (!(a < b)) throw new Error("Require a < b.");
        return {
            start: a,
            end: b,
            formula: x => uniformPDF(x, a, b),
            exactCDF: x => x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a),
            description: `Uniform PDF: f(x) = ${(1 / (b - a)).toFixed(4)} on [${a}, ${b}].`
        };
    }

    if (d === "triangular") {
        const a = Number(document.getElementById("a").value);
        const b = Number(document.getElementById("b").value);
        const c = Number(document.getElementById("c").value);
        if (!(a < c && c < b)) throw new Error("Require a < c < b.");
        return {
            start: a,
            end: b,
            formula: x => triangularPDF(x, a, c, b),
            description: `Triangular PDF on [${a}, ${b}] with mode c = ${c}.`
        };
    }

    if (d === "linear") {
        const a = Number(document.getElementById("a").value);
        const b = Number(document.getElementById("b").value);
        const direction = document.getElementById("linearDirection").value;
        if (!(a < b)) throw new Error("Require a < b.");
        return {
            start: a,
            end: b,
            formula: x => linearPDF(x, a, b, direction),
            description: `Linear ${direction} PDF on [${a}, ${b}], normalized so total area equals 1.`
        };
    }

    if (d === "piecewise") {
        const a = Number(document.getElementById("a").value);
        const m = Number(document.getElementById("m").value);
        const b = Number(document.getElementById("b").value);
        const h1 = Number(document.getElementById("h1").value);
        if (!(a < m && m < b)) throw new Error("Require a < m < b.");
        const h2 = (1 - (m - a) * h1) / (b - m);
        if (!(h1 >= 0 && h2 >= 0)) throw new Error("Invalid heights. Choose h1 so both pieces are non-negative and total area equals 1.");
        return {
            start: a,
            end: b,
            formula: x => piecewisePDF(x, a, m, b, h1),
            breakpoints: [a, m, b],
            pieceHeights: [h1, h2],
            description: `Piecewise PDF: f(x) = ${h1.toFixed(4)} on [${a}, ${m}], and f(x) = ${h2.toFixed(4)} on (${m}, ${b}].`
        };
    }

    const mean = Number(document.getElementById("mean").value);
    const sd = Number(document.getElementById("sd").value);
    if (!(sd > 0)) throw new Error("Standard deviation must be positive.");
    return {
        start: mean - 4 * sd,
        end: mean + 4 * sd,
        formula: x => normalPDF(x, mean, sd),
        exactCDF: x => normalCDF(x, mean, sd),
        description: `Normal PDF with mean = ${mean} and standard deviation = ${sd}.`
    };
}

function numericProbability(model, left, right) {
    const a = Math.max(left, model.start);
    const b = Math.min(right, model.end);
    if (!(a < b)) return 0;
    const n = 1200;
    const dx = (b - a) / n;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const x1 = a + i * dx;
        const x2 = x1 + dx;
        area += ((model.formula(x1) + model.formula(x2)) / 2) * dx;
    }
    return area;
}

function probabilityForRegion(model, left, right) {
    if (model.exactCDF) {
        const a = left === -Infinity ? 0 : model.exactCDF(left);
        const b = right === Infinity ? 1 : model.exactCDF(right);
        return Math.max(0, Math.min(1, b - a));
    }
    return numericProbability(model, left, right);
}

function buildCurve(model) {
    if (model.breakpoints && model.pieceHeights) {
        const [a, m, b] = model.breakpoints;
        const [h1, h2] = model.pieceHeights;
        return { xs: [a, m, m, b], ys: [h1, h1, h2, h2] };
    }
    const xs = model.breakpoints ? model.breakpoints.flatMap((x, i) => i === 0 ? [x] : [x, x]) : linspace(model.start, model.end, 500);
    const cleanXs = model.breakpoints ? xs : xs;
    const ys = cleanXs.map(x => model.formula(x));
    return { xs: cleanXs, ys };
}

function buildShade(model, left, right) {
    const a = Math.max(left, model.start);
    const b = Math.min(right, model.end);
    if (!(a < b)) return { x: [], y: [] };
    const internalBreaks = (model.breakpoints || []).filter(x => x > a && x < b);
    const xs = [a, ...internalBreaks, b].sort((x, y) => x - y);
    const dense = [];
    for (let i = 0; i < xs.length - 1; i++) {
        dense.push(...linspace(xs[i], xs[i + 1], 80).slice(i === 0 ? 0 : 1));
    }
    return { x: [a, ...dense, b], y: [0, ...dense.map(x => model.formula(x)), 0] };
}

function generateSimulation() {
    try {
        const model = makeSimulationModel();
        const region = getRegionBounds();
        const probability = probabilityForRegion(model, region.left, region.right);
        const curve = buildCurve(model);
        const shade = buildShade(model, region.left, region.right);

        Plotly.newPlot("graph", [
            { x: curve.xs, y: curve.ys, type: "scatter", mode: "lines", name: "PDF", line: { color: "#0b66c3", width: 3 } },
            { x: shade.x, y: shade.y, type: "scatter", mode: "lines", fill: "tozeroy", name: "Selected probability region", line: { color: "#f59f00" }, fillcolor: "rgba(245, 159, 0, 0.35)" }
        ], {
            title: "PDF and Shaded Probability Region",
            xaxis: { title: "x" },
            yaxis: { title: "f(x)", rangemode: "tozero" },
            margin: { t: 50, r: 20, b: 50, l: 60 }
        }, { responsive: true });

        showMessage("result", `${model.description}<br>Probability = ${probability.toFixed(4)}`, false);
    } catch (error) {
        showMessage("result", error.message, true);
    }
}

function showMessage(id, html, isError) {
    const element = document.getElementById(id);
    element.innerHTML = html;
    element.classList.toggle("error", Boolean(isError));
}

function parseData() {
    return document.getElementById("dataInput").value
        .split(/[\s,;]+/)
        .map(Number)
        .filter(Number.isFinite);
}

function mean(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
}

function sd(data) {
    const m = mean(data);
    return Math.sqrt(data.reduce((s, x) => s + Math.pow(x - m, 2), 0) / (data.length - 1));
}

function median(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function estimateModel(data, modelName) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = mean(data);
    const stdev = sd(data);
    if (!(min < max)) throw new Error("The data need at least two different values.");

    if (modelName === "normal") {
        if (!(stdev > 0)) throw new Error("Standard deviation must be positive.");
        return {
            start: avg - 4 * stdev,
            end: avg + 4 * stdev,
            formula: x => normalPDF(x, avg, stdev),
            parameters: `mean = ${avg.toFixed(3)}, standard deviation = ${stdev.toFixed(3)}`,
            interpretation: "This fit is reasonable when the histogram is roughly bell-shaped and centered near the fitted mean."
        };
    }

    if (modelName === "uniform") {
        return {
            start: min,
            end: max,
            formula: x => uniformPDF(x, min, max),
            parameters: `a = ${min.toFixed(3)}, b = ${max.toFixed(3)}, height = ${(1 / (max - min)).toFixed(3)}`,
            interpretation: "This fit is reasonable when the histogram bars have similar heights across the interval."
        };
    }

    if (modelName === "triangular") {
        let mode = 3 * avg - min - max;
        if (!(mode > min && mode < max)) mode = median(data);
        return {
            start: min,
            end: max,
            formula: x => triangularPDF(x, min, mode, max),
            parameters: `a = ${min.toFixed(3)}, mode = ${mode.toFixed(3)}, b = ${max.toFixed(3)}`,
            interpretation: "This fit is reasonable when the histogram rises toward one central peak and then falls."
        };
    }

    if (modelName === "linear") {
        const direction = avg > (min + max) / 2 ? "increasing" : "decreasing";
        return {
            start: min,
            end: max,
            formula: x => linearPDF(x, min, max, direction),
            parameters: `a = ${min.toFixed(3)}, b = ${max.toFixed(3)}, direction = ${direction}`,
            interpretation: `This fit is reasonable when the histogram shows a mostly ${direction} trend across the interval.`
        };
    }

    const split = median(data);
    if (!(split > min && split < max)) throw new Error("Piecewise fit needs data on both sides of the split point.");
    const leftCount = data.filter(x => x <= split).length;
    const rightCount = data.length - leftCount;
    const h1 = (leftCount / data.length) / (split - min);
    const h2 = (rightCount / data.length) / (max - split);
    return {
        start: min,
        end: max,
        formula: x => x <= split ? h1 : h2,
        breakpoints: [min, split, max],
        pieceHeights: [h1, h2],
        parameters: `a = ${min.toFixed(3)}, split = ${split.toFixed(3)}, b = ${max.toFixed(3)}, h1 = ${h1.toFixed(3)}, h2 = ${h2.toFixed(3)}`,
        interpretation: "This fit is reasonable when the histogram looks flatter within each side but has a visible change around the split."
    };
}

function fitDataModel() {
    try {
        const data = parseData();
        const modelName = document.getElementById("fitModel").value;
        if (data.length < 5) throw new Error("Please enter at least five numerical values for a useful fit.");

        const model = estimateModel(data, modelName);
        const curve = buildCurve(model);

        Plotly.newPlot("dataGraph", [
            { x: data, type: "histogram", histnorm: "probability density", name: "Data histogram", marker: { color: "rgba(11, 102, 195, 0.45)" } },
            { x: curve.xs, y: curve.ys, type: "scatter", mode: "lines", name: "Fitted PDF", line: { color: "#d9480f", width: 3 } }
        ], {
            title: "Histogram with Fitted PDF",
            xaxis: { title: "Data values" },
            yaxis: { title: "Density", rangemode: "tozero" },
            bargap: 0.05,
            margin: { t: 50, r: 20, b: 50, l: 60 }
        }, { responsive: true });

        showMessage("fitResult", `Estimated ${modelName} model: ${model.parameters}.<br>${model.interpretation}`, false);
    } catch (error) {
        showMessage("fitResult", error.message, true);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById("dataInput").value = reader.result;
        fitDataModel();
    };
    reader.readAsText(file);
}

function loadDataset(name) {
    document.getElementById("dataInput").value = testDatasets[name].join(", ");
    document.getElementById("fitModel").value = name === "normal" ? "normal" : name;
    fitDataModel();
}

setGithubLink();
updateInputs();
updateBounds();
generateSimulation();
fitDataModel();

document.addEventListener("input", event => {
    if (event.target.closest("#parameterInputs") || event.target.closest("#boundInputs")) generateSimulation();
    if (event.target.id === "dataInput") fitDataModel();
});

document.getElementById("distribution").addEventListener("change", () => {
    updateInputs();
    generateSimulation();
});

document.getElementById("probabilityType").addEventListener("change", () => {
    updateBounds();
    generateSimulation();
});

document.getElementById("fitModel").addEventListener("change", fitDataModel);
document.getElementById("fitButton").addEventListener("click", fitDataModel);
document.getElementById("dataFile").addEventListener("change", handleFileUpload);

document.querySelectorAll("[data-dataset]").forEach(button => {
    button.addEventListener("click", () => loadDataset(button.dataset.dataset));
});