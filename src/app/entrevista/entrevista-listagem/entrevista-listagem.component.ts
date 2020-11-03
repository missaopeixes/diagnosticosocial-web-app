import { Component, OnInit } from '@angular/core';
import { Listagem } from '@app/shared/listagem';
import { Entrevista } from '@app/entrevista/entrevista';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '@app/shared/modal/modal.service';
import { EntrevistaService } from '@app/entrevista/entrevista.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';

const ITENS_POR_PAGINA = 15;
const ID_MODAL_EXCLUSAO = '#ds-entrevista-modal-exclusao';

@Component({
  selector: 'app-entrevista-listagem',
  templateUrl: './entrevista-listagem.component.html',
  styleUrls: ['./entrevista-listagem.component.scss']
})
export class EntrevistaListagemComponent implements OnInit {

  public listagem: Listagem<Entrevista>;
  public carregando: boolean;
  public erroListagem: boolean;
  public salvando: boolean;
  public entrevistaExclusao: Entrevista;
  public formFiltro: FormGroup;
  public exibeFiltro: boolean;

  constructor(
    private _entrevistaService: EntrevistaService,
    private _toastrService: ToastrService,
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _modalService: ModalService) {
  }

  ngOnInit() {
    this.listagem = new Listagem<Entrevista>();
    this.exibeFiltro = true;

    this.formFiltro = this._formBuilder.group({
      evento: [''],
      usuario: [''],
      nome: [''],
      concluida: ['']
    });
    this.formFiltro.controls['concluida'].setValue(true);

    this.obterListagem();
  }

  obterListagem(refresh: boolean = false) {
    if (refresh) {
      this.listagem.pagina = 1;
    }
    else {
      this.listagem.pagina++;
    }

    this.carregando = true;
    this._entrevistaService.obterPorPagina(this.listagem.pagina,
      ITENS_POR_PAGINA,
      this.formFiltro.value.evento,
      this.formFiltro.value.usuario,
      this.formFiltro.value.nome,
      this.formFiltro.value.concluida)
    .pipe(finalize(() =>
      this.carregando = false
    ))
    .subscribe((listagem: Listagem<Entrevista>) =>
      refresh ? this.listagem.atualizar(listagem) : this.listagem.incrementar(listagem),
      () => this.erroListagem = true
    );
  }

  confirmarExclusao(obj: Entrevista) {
    this.entrevistaExclusao = obj;
    this._modalService.open(ID_MODAL_EXCLUSAO);
  }

  excluir() {
    this.salvando = true;
    this._entrevistaService.excluir(this.entrevistaExclusao.id)
    .then(() => {
      _.remove(this.listagem.conteudo, (obj) => {
        return obj.id === this.entrevistaExclusao.id;
      })
      this.listagem.total--;
      this._toastrService.success('Entrevista excluida com sucesso.', 'Ok');
      this.salvando = false;
      this._modalService.close(ID_MODAL_EXCLUSAO);
    })
    .catch(({error}) => {
      this._toastrService.error(error, 'Ops!');
      this.salvando = false;
    });
  }

  novo() {
    this._router.navigate(['/entrevistas/novo']);
  }

  visualizar(entrevista: Entrevista) {
    this._router.navigate([`/entrevistas/${entrevista.id}`]);
  }

  formatDate(utc: string) {
    return moment(utc).format('DD/MM/YY HH:mm');
  }
}
