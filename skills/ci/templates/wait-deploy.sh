#!/usr/bin/env bash
# Espera o deploy de uma API em IIS terminar e imprime as impressões digitais básicas.
# Como funciona: durante o upload o CI deixa um app_offline.htm no servidor, então a API
# responde 503 por ~30-60 s e volta ao normal. Ver essa janela prova que o pipeline rodou.
#
# Uso: ./wait-deploy.sh https://api.exemplo.com.br/rota-que-aceita-GET-ou-da-405 [timeout_s=450]
#
# Só faz GET/OPTIONS e POST inválido; nunca envia dado real (pode disparar e-mail de verdade).
set -u
URL="${1:?informe a URL de uma rota da API}"
TIMEOUT="${2:-450}"
BASE="$(echo "$URL" | sed -E 's#(https?://[^/]+).*#\1#')"

seen=0
end=$((SECONDS + TIMEOUT))
while [ $SECONDS -lt $end ]; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$URL")
  if [ "$code" = "503" ] && [ $seen = 0 ]; then
    seen=1; echo "[$SECONDS s] API em manutenção (upload em andamento)"
  fi
  if [ $seen = 1 ] && [ "$code" != "503" ]; then
    echo "[$SECONDS s] API voltou (HTTP $code) -> deploy concluído"
    break
  fi
  sleep 3
done
[ $seen = 0 ] && echo "Não vi a janela de manutenção em ${TIMEOUT}s: o deploy pode ter falhado (ver o job no GitLab)."

sleep 5
echo "--- estado final"
printf "GET %s: " "$URL"; curl -s -o /dev/null -w "%{http_code}\n" "$URL"
printf "app_offline.htm ainda existe? (esperado 404): "; curl -s -o /dev/null -w "%{http_code}\n" "$BASE/app_offline.htm"
