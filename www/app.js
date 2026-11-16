(function () {
  const DEFAULTS = {
    printDate: '2026-07-04', tower: 'B3', flatNo: '', floor: '1st',
    superArea: 2304, builtUpArea: 1969, carpetArea: 1396,
    propertyType: '3BHK + 4 Balcony', plcType: 'Floor', paymentPlan: '25:25:25:25',
    effectiveRate: 11500, floorPlcRate: 250, parkFacingRate: 0,
    greenBeltRate: 0, cornerRate: 0, parkPoolRate: 0,
    parkingType: 'Covered', parkingAmount: 700000, leaseRate: 80,
    clubMembership: 250000, powerKva: 5, powerRate: 25000,
    ifmsRate: 50, gstRate: 5, projectName: '', projectAddress: '', companyName: ''
  };

  function numeric(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function calculateQuotePure(values) {
    const area = numeric(values.superArea);
    const basicCost = area * numeric(values.effectiveRate);
    const plc = {
      floor: area * numeric(values.floorPlcRate),
      parkFacing: area * numeric(values.parkFacingRate),
      greenBelt: area * numeric(values.greenBeltRate),
      corner: area * numeric(values.cornerRate),
      parkPool: area * numeric(values.parkPoolRate)
    };
    const totalPlc = Object.values(plc).reduce((sum, amount) => sum + amount, 0);
    const parkingCost = values.parkingType === 'None' ? 0 : numeric(values.parkingAmount);
    const leaseCost = area * numeric(values.leaseRate);
    const clubCost = numeric(values.clubMembership);
    const powerCost = numeric(values.powerKva) * numeric(values.powerRate);
    const totalAdditional = parkingCost + leaseCost + clubCost + powerCost;
    const salesConsideration = basicCost + totalPlc + totalAdditional;
    const ifmsCost = area * numeric(values.ifmsRate);
    const gstCost = salesConsideration * (numeric(values.gstRate) / 100);
    const grandTotal = salesConsideration + ifmsCost + gstCost;

    return {
      area, basicCost, plc, totalPlc, parkingCost, leaseCost, clubCost,
      powerCost, totalAdditional, salesConsideration, ifmsCost, gstCost, grandTotal
    };
  }

  function formatINR(value) {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }

  function formatNumber(value, maximumFractionDigits = 0) {
    return numeric(value).toLocaleString('en-IN', { maximumFractionDigits });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateQuotePure, formatINR, DEFAULTS };
  }

  if (typeof document === 'undefined') return;

  const inputIds = Object.keys(DEFAULTS);
  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => { $(id).textContent = value; };
  let logoDataUrl = '';
  let projectLogoDataUrl = '';

  function updateBranding() {
    const projectName = $('projectName').value.trim();
    const projectAddress = $('projectAddress').value.trim();
    const companyName = $('companyName').value.trim();
    const hasLogo = /^data:image\/(png|jpeg|webp);base64,/i.test(logoDataUrl);
    const hasProjectLogo = /^data:image\/(png|jpeg|webp);base64,/i.test(projectLogoDataUrl);
    const header = $('printBrandHeader');
    const projectIdentity = header.querySelector('.print-project-identity');
    const companyIdentity = header.querySelector('.print-company-identity');
    const printProjectLogo = $('printProjectLogo');
    const printLogo = $('printBrandLogo');
    const preview = $('logoPreview');
    const previewImage = $('logoPreviewImage');
    const projectPreview = $('projectLogoPreview');
    const projectPreviewImage = $('projectLogoPreviewImage');

    setText('printProjectName', projectName);
    setText('printProjectAddress', projectAddress);
    setText('printBrandName', companyName);
    header.hidden = !projectName && !projectAddress && !hasProjectLogo && !companyName && !hasLogo;
    projectIdentity.hidden = !projectName && !projectAddress && !hasProjectLogo;
    companyIdentity.hidden = !companyName && !hasLogo;
    printProjectLogo.hidden = !hasProjectLogo;
    printLogo.hidden = !hasLogo;
    projectPreview.hidden = !hasProjectLogo;
    preview.hidden = !hasLogo;
    $('removeProjectLogoButton').hidden = !hasProjectLogo;
    $('removeLogoButton').hidden = !hasLogo;

    if (hasProjectLogo) {
      printProjectLogo.src = projectLogoDataUrl;
      projectPreviewImage.src = projectLogoDataUrl;
    } else {
      printProjectLogo.removeAttribute('src');
      projectPreviewImage.removeAttribute('src');
    }

    if (hasLogo) {
      printLogo.src = logoDataUrl;
      previewImage.src = logoDataUrl;
    } else {
      printLogo.removeAttribute('src');
      previewImage.removeAttribute('src');
    }
  }

  function readValues() {
    return inputIds.reduce((values, id) => {
      const element = $(id);
      values[id] = element ? element.value : DEFAULTS[id];
      return values;
    }, {});
  }

  function writeValues(values) {
    inputIds.forEach((id) => {
      if ($(id)) $(id).value = values[id] ?? DEFAULTS[id];
    });
  }

  function cloneForPdf(element) {
    const clone = element.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    return clone;
  }

  function waitForImages(container) {
    const images = Array.from(container.querySelectorAll('img:not([hidden])'));
    return Promise.all(images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  function pdfFilename() {
    const project = $('projectName').value.trim() || 'Final Price';
    const flat = $('flatNo').value.trim();
    const safe = (value) => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    return `${safe(project)}${flat ? `-Flat-${safe(flat)}` : ''}-Cost-Estimate.pdf`;
  }

  async function downloadPdf() {
    if (typeof window.html2pdf !== 'function') {
      window.alert('The PDF generator is unavailable. Please refresh the app and try again.');
      return;
    }

    const button = $('downloadPdfButton');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparing PDF…';
    updateBranding();

    const capture = document.createElement('div');
    capture.className = 'pdf-capture';
    capture.append(
      cloneForPdf($('printBrandHeader')),
      cloneForPdf(document.querySelector('.summary-card'))
    );
    document.body.append(capture);

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await waitForImages(capture);
      await window.html2pdf().set({
        margin: 0,
        filename: pdfFilename(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      }).from(capture).save();
    } catch (error) {
      console.error('PDF generation failed', error);
      window.alert('The PDF could not be generated. Please try again.');
    } finally {
      capture.remove();
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function summaryRow(label, amount) {
    const row = document.createElement('div');
    row.className = 'summary-row';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const amountElement = document.createElement('strong');
    amountElement.textContent = amount ? formatINR(amount) : '—';
    row.append(labelElement, amountElement);
    return row;
  }

  function render() {
    const values = readValues();
    const totals = calculateQuotePure(values);

    setText('selectionSummary', `Tower ${values.tower || '—'} · ${values.floor || '—'} floor`);
    setText('areaSummary', `${formatNumber(totals.area)} sq.ft. · ${values.propertyType || '—'}`);
    setText('paymentPlanSummary', `${values.paymentPlan || 'Custom'} plan`);

    setText('basicCostInput', formatINR(totals.basicCost));
    setText('basicCost', formatINR(totals.basicCost));
    setText('floorPlcAmount', formatINR(totals.plc.floor));
    setText('parkFacingAmount', formatINR(totals.plc.parkFacing));
    setText('greenBeltAmount', formatINR(totals.plc.greenBelt));
    setText('cornerAmount', formatINR(totals.plc.corner));
    setText('parkPoolAmount', formatINR(totals.plc.parkPool));
    setText('totalPlcInput', formatINR(totals.totalPlc));
    setText('totalPlc', formatINR(totals.totalPlc));

    const plcRows = $('plcRows');
    plcRows.replaceChildren(
      summaryRow(`Floor PLC · ₹${formatNumber(values.floorPlcRate)} / sq.ft.`, totals.plc.floor),
      summaryRow(`Park facing · ₹${formatNumber(values.parkFacingRate)} / sq.ft.`, totals.plc.parkFacing),
      summaryRow(`Green belt · ₹${formatNumber(values.greenBeltRate)} / sq.ft.`, totals.plc.greenBelt),
      summaryRow(`Corner · ₹${formatNumber(values.cornerRate)} / sq.ft.`, totals.plc.corner),
      summaryRow(`Park-pool · ₹${formatNumber(values.parkPoolRate)} / sq.ft.`, totals.plc.parkPool)
    );

    setText('parkingLabel', `Parking 1 · ${values.parkingType}`);
    setText('parkingCost', formatINR(totals.parkingCost));
    setText('leaseNote', `₹${formatNumber(values.leaseRate)} × ${formatNumber(totals.area)}`);
    setText('leaseCost', formatINR(totals.leaseCost));
    setText('clubCost', formatINR(totals.clubCost));
    setText('powerNote', `${formatNumber(values.powerKva, 1)} KVA × ₹${formatNumber(values.powerRate)}`);
    setText('powerCost', formatINR(totals.powerCost));
    setText('totalAdditionalInput', formatINR(totals.totalAdditional));
    setText('totalAdditional', formatINR(totals.totalAdditional));
    setText('salesConsideration', formatINR(totals.salesConsideration));
    setText('ifmsNote', `₹${formatNumber(values.ifmsRate)} × ${formatNumber(totals.area)}`);
    setText('ifmsCost', formatINR(totals.ifmsCost));
    setText('gstLabel', `GST · ${formatNumber(values.gstRate, 1)}%`);
    setText('gstCost', formatINR(totals.gstCost));
    setText('grandTotal', formatINR(totals.grandTotal));
    setText('grandTotalBottom', formatINR(totals.grandTotal));
    setText('mobileTotal', formatINR(totals.grandTotal));
    setText('perSqftTotal', totals.area ? `${formatINR(totals.grandTotal / totals.area)} per sq.ft. all-in` : 'Add an area to calculate');
    updateBranding();

    try { localStorage.setItem('finalPriceCostSheet', JSON.stringify(values)); } catch (_) { /* Storage is optional. */ }
  }

  inputIds.forEach((id) => {
    if ($(id)) {
      $(id).addEventListener('input', render);
      $(id).addEventListener('change', render);
    }
  });

  document.querySelectorAll('.panel-title').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('.panel');
      const collapsed = panel.classList.toggle('collapsed');
      button.setAttribute('aria-expanded', String(!collapsed));
      button.querySelector('i').textContent = collapsed ? '+' : '−';
    });
  });

  $('resetButton').addEventListener('click', () => {
    writeValues(DEFAULTS);
    logoDataUrl = '';
    projectLogoDataUrl = '';
    $('logoUpload').value = '';
    $('projectLogoUpload').value = '';
    try {
      localStorage.removeItem('finalPriceCompanyLogo');
      localStorage.removeItem('finalPriceProjectLogo');
    } catch (_) { /* Storage is optional. */ }
    render();
  });
  $('printButton').addEventListener('click', () => window.print());
  $('downloadPdfButton').addEventListener('click', downloadPdf);

  $('logoUpload').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      setText('logoUploadMessage', 'Please choose a PNG, JPG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setText('logoUploadMessage', 'Logo must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      logoDataUrl = String(reader.result || '');
      try {
        localStorage.setItem('finalPriceCompanyLogo', logoDataUrl);
        setText('logoUploadMessage', `${file.name} will appear on the printed estimate.`);
      } catch (_) {
        setText('logoUploadMessage', 'Logo added for this session. Browser storage is unavailable.');
      }
      updateBranding();
    });
    reader.addEventListener('error', () => setText('logoUploadMessage', 'The logo could not be read. Please try another image.'));
    reader.readAsDataURL(file);
  });

  $('removeLogoButton').addEventListener('click', () => {
    logoDataUrl = '';
    $('logoUpload').value = '';
    try { localStorage.removeItem('finalPriceCompanyLogo'); } catch (_) { /* Storage is optional. */ }
    setText('logoUploadMessage', 'Logo removed.');
    updateBranding();
  });

  $('projectLogoUpload').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      setText('projectLogoUploadMessage', 'Please choose a PNG, JPG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setText('projectLogoUploadMessage', 'Logo must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      projectLogoDataUrl = String(reader.result || '');
      try {
        localStorage.setItem('finalPriceProjectLogo', projectLogoDataUrl);
        setText('projectLogoUploadMessage', `${file.name} will appear at the top-left of the PDF.`);
      } catch (_) {
        setText('projectLogoUploadMessage', 'Logo added for this session. Browser storage is unavailable.');
      }
      updateBranding();
    });
    reader.addEventListener('error', () => setText('projectLogoUploadMessage', 'The logo could not be read. Please try another image.'));
    reader.readAsDataURL(file);
  });

  $('removeProjectLogoButton').addEventListener('click', () => {
    projectLogoDataUrl = '';
    $('projectLogoUpload').value = '';
    try { localStorage.removeItem('finalPriceProjectLogo'); } catch (_) { /* Storage is optional. */ }
    setText('projectLogoUploadMessage', 'Project logo removed.');
    updateBranding();
  });

  try {
    const saved = JSON.parse(localStorage.getItem('finalPriceCostSheet'));
    if (saved && typeof saved === 'object') writeValues({ ...DEFAULTS, ...saved });
    const savedLogo = localStorage.getItem('finalPriceCompanyLogo') || '';
    if (/^data:image\/(png|jpeg|webp);base64,/i.test(savedLogo)) logoDataUrl = savedLogo;
    const savedProjectLogo = localStorage.getItem('finalPriceProjectLogo') || '';
    if (/^data:image\/(png|jpeg|webp);base64,/i.test(savedProjectLogo)) projectLogoDataUrl = savedProjectLogo;
  } catch (_) { /* Start from the supplied sheet defaults. */ }

  render();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
