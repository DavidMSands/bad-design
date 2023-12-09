import { Component } from '@angular/core';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent {
  showChat = false;
  animateElements = false;
  currentMessage = '';
  messages: { text: string, sender: 'user' | 'bot' }[] = [];
  isTyping = false;

  toggleChat() {
    this.showChat = !this.showChat;

        if (this.showChat) {
            this.animateElements = true;

        } else {
            this.animateElements = false;
        }
    
  }

  showTypingAnimation() {
    setTimeout(() => {
      this.isTyping = true;
      setTimeout(() => {
        this.isTyping = false
        setTimeout(() => {
          this.isTyping = true;
          setTimeout(() => {
            this.isTyping = false;
            this.simulateResponse();
          }, 5000);
        }, 3000);
      }, 10000);
    }, 2000);
}

simulateResponse() {
  const response = '\u{1F595}';
  this.messages.push({ text: response, sender: 'bot' });
}

  sendMessage() {
    if (this.currentMessage.trim()) {
        this.messages.push({ text: this.currentMessage, sender: 'user' });
        this.currentMessage = '';
        this.showTypingAnimation();
    }
}
  
  onHelpButtonClick() {
    console.log('Help button clicked!');
  }
}