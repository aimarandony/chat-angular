import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from 'src/app/models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  private client: Client;
  conectado: boolean = false;
  oMensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  thisuser: boolean = false;
  writing:string;

  private urlHeroku:string = 'https://chatandony.herokuapp.com/chat-websocket';
  private urlLocal:string = 'http://localhost:8080/chat-websocket';

  constructor() {}

  ngOnInit(): void {
    this.client = new Client();
    this.client.webSocketFactory = () => {
      return new SockJS(this.urlHeroku);
    };

    this.client.onConnect = (frame) => {
      console.log('Conectado:', this.client.connected, ':', frame);
      this.conectado = true;

      this.client.subscribe('/chat/mensaje', (e) => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje.fecha = new Date(mensaje.fecha);

        if (
          !this.oMensaje.color &&
          mensaje.tipo == 'NUEVO_USUARIO' &&
          this.oMensaje.username == mensaje.username
        ) {
          this.oMensaje.color = mensaje.color;
        }

        if (this.oMensaje.username == mensaje.username){
          this.thisuser = true;
        } else {
          this.thisuser = false;
        }

        this.mensajes.push(mensaje);
        console.warn(mensaje);
        console.log(this.mensajes);
      });

      this.client.subscribe('/chat/escribiendo', (e) => {
        this.writing = e.body;
        setTimeout(() => this.writing = '', 3000);
      });

      this.oMensaje.tipo = 'NUEVO_USUARIO';
      this.client.publish({
        destination: '/app/mensaje',
        body: JSON.stringify(this.oMensaje),
      });
    };

    this.client.onDisconnect = (frame) => {
      console.log('Desconectado:', !this.client.connected, ':', frame);
      this.conectado = false;
    };
  }

  conectar(): void {
    let username: string = prompt('Escriba su nombre de usuario');
    this.oMensaje.username = username;
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.oMensaje.tipo = 'NUEVO_MENSAJE';
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.oMensaje),
    });
    this.oMensaje.texto = '';
  }

  escribiendo(): void{
    this.client.publish({
      destination: '/app/escribiendo',
      body: this.oMensaje.username,
    });
  }
}
