// No imports needed - this file only contains interfaces and utility functions

export interface SupportLink {
  text: string;
  url: string;
  icon?: string;
  bgColor?: string;
  textColor?: string;
  isBMC?: boolean; // Special flag for Buy Me a Coffee button
}

export class SupportSection {
  private static bmcScriptLoaded = false;

  static addSupportSection(containerEl: HTMLElement, pluginName: string = 'this plugin') {
    // Support Section Header
    containerEl.createEl('h3', { text: 'Support the Developer' });
    
    // Support Links Container
    const supportDiv = containerEl.createDiv();
    supportDiv.style.display = 'flex';
    supportDiv.style.flexWrap = 'wrap';
    supportDiv.style.gap = '15px';
    supportDiv.style.alignItems = 'center';
    supportDiv.style.marginTop = '10px';
    supportDiv.style.marginBottom = '20px';

    // Default support links
    const defaultLinks: SupportLink[] = [
      {
        text: '⭐ GitHub',
        url: 'https://github.com/zaharenok',
        bgColor: 'var(--interactive-accent)',
        textColor: 'var(--text-on-accent)'
      },
      {
        text: '☕ Buy Me a Coffee',
        url: 'https://buymeacoffee.com/olegzakhark',
        isBMC: true // Special flag for BMC button
      }
    ];

    // Add each support link
    defaultLinks.forEach(link => {
      if (link.isBMC) {
        this.addBMCLink(supportDiv);
      } else {
        this.addSupportLink(supportDiv, link);
      }
    });

    // Support text
    const supportText = containerEl.createEl('p', {
      text: `If you find ${pluginName} helpful, please consider supporting its development!`
    });
    supportText.style.fontSize = '0.9em';
    supportText.style.color = 'var(--text-muted)';
    supportText.style.marginTop = '10px';
  }

  private static addBMCLink(container: HTMLElement) {
    // Create container for BMC button
    const bmcContainer = container.createDiv('bmc-container');
    bmcContainer.style.display = 'inline-block';
    bmcContainer.style.margin = '0';
    bmcContainer.style.padding = '0';
    bmcContainer.style.lineHeight = '1';
    
    // Add BMC button script if not already loaded
    if (!this.bmcScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
      script.setAttribute('data-name', 'bmc-button');
      script.setAttribute('data-slug', 'olegzakhark');
      script.setAttribute('data-color', '#FFDD00');
      script.setAttribute('data-emoji', '☕');
      script.setAttribute('data-font', 'Poppins');
      script.setAttribute('data-text', 'Buy me a coffee');
      script.setAttribute('data-outline-color', '#000000');
      script.setAttribute('data-font-color', '#000000');
      script.setAttribute('data-coffee-color', '#ffffff');
      script.async = true;
      
      document.head.appendChild(script);
      this.bmcScriptLoaded = true;
    }
    
    // Create BMC button placeholder
    bmcContainer.innerHTML = `
      <a href="https://buymeacoffee.com/olegzakhark" 
         target="_blank" 
         class="bmc-button" 
         style="text-decoration: none; display: inline-block; margin: 0; padding: 10px 16px; background-color: #FFDD00; border-radius: 4px; color: #000000; font-family: 'Poppins', sans-serif; font-weight: bold; font-size: 14px; line-height: 1.2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;"
         onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)';"
         onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)';">
        ☕ Buy me a coffee
      </a>
    `;
    
    return bmcContainer;
  }

  private static addSupportLink(container: HTMLElement, link: SupportLink) {
    const linkEl = container.createEl('a', {
      text: link.text,
      href: link.url
    });
    
    // Apply styles
    Object.assign(linkEl.style, {
      textDecoration: 'none',
      padding: '10px 16px',
      backgroundColor: link.bgColor ?? 'var(--interactive-accent)',
      color: link.textColor ?? 'var(--text-on-accent)',
      borderRadius: '4px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      minWidth: 'fit-content',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      lineHeight: '1.2',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    } as CSSStyleDeclaration);

    // Hover effect
    linkEl.addEventListener('mouseenter', () => {
      linkEl.style.opacity = '0.9';
      linkEl.style.transform = 'translateY(-1px)';
      linkEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });
    
    linkEl.addEventListener('mouseleave', () => {
      linkEl.style.opacity = '1';
      linkEl.style.transform = 'translateY(0)';
      linkEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    linkEl.setAttribute('target', '_blank');
    return linkEl;
  }
}
