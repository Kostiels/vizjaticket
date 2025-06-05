class Partners extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    render() {
        this.innerHTML = `
            <section class="partners-section">
                <h2 class="partners-title">Nasi partnerzy</h2>
                <div class="partners-grid">
                    <div class="partner-card">
                        <div class="partner-image-container">
                            <img src="/images/partners/partner1.png" alt="Partner 1" class="partner-image">
                        </div>
                    </div>
                    <div class="partner-card">
                        <div class="partner-image-container">
                            <img src="/images/partners/partner2.png" alt="Partner 2" class="partner-image">
                        </div>
                    </div>
                    <div class="partner-card">
                        <div class="partner-image-container">
                            <img src="/images/partners/partner3.png" alt="Partner 3" class="partner-image">
                        </div>
                    </div>
                    <div class="partner-card">
                        <div class="partner-image-container">
                            <img src="/images/partners/partner4.png" alt="Partner 4" class="partner-image">
                        </div>
                    </div>
                    <div class="partner-card">
                        <div class="partner-image-container">
                            <img src="/images/partners/partner5.png" alt="Partner 5" class="partner-image">
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('partners-section', Partners);
