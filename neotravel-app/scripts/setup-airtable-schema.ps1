$ErrorActionPreference = 'Stop'

$envMap = @{}
Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^(.*?)=(.*)$') {
    $envMap[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$apiKey = $envMap['AIRTABLE_API_KEY']
$baseId = $envMap['AIRTABLE_BASE_ID']
$headers = @{ Authorization = "Bearer $apiKey"; 'Content-Type' = 'application/json' }

function Get-Tables {
  Invoke-RestMethod -Uri "https://api.airtable.com/v0/meta/bases/$baseId/tables" -Headers $headers -Method Get
}

function Ensure-Table($tableName, $fields) {
  $tables = Get-Tables
  $existing = $tables.tables | Where-Object { $_.name -eq $tableName } | Select-Object -First 1
  if ($null -ne $existing) { return $existing.id }

  $body = @{ name = $tableName; fields = $fields } | ConvertTo-Json -Depth 20
  $created = Invoke-RestMethod -Uri "https://api.airtable.com/v0/meta/bases/$baseId/tables" -Headers $headers -Method Post -Body $body
  return $created.id
}

function Ensure-Field($tableId, $name, $type, $options) {
  $tables = Get-Tables
  $table = $tables.tables | Where-Object { $_.id -eq $tableId } | Select-Object -First 1
  $exists = $table.fields | Where-Object { $_.name -eq $name } | Select-Object -First 1
  if ($null -ne $exists) { return }

  $bodyObj = @{ name = $name; type = $type }
  if ($null -ne $options) { $bodyObj.options = $options }

  $body = $bodyObj | ConvertTo-Json -Depth 20
  Invoke-RestMethod -Uri "https://api.airtable.com/v0/meta/bases/$baseId/tables/$tableId/fields" -Headers $headers -Method Post -Body $body | Out-Null
}

function Ensure-TarificationSeed($tableName) {
  $endpoint = "https://api.airtable.com/v0/$baseId/$([uri]::EscapeDataString($tableName))"
  $existing = Invoke-RestMethod -Uri ($endpoint + "?maxRecords=100") -Headers @{ Authorization = "Bearer $apiKey" } -Method Get

  $hasBaseRules = $false
  $hasKmGrid = $false
  foreach ($record in $existing.records) {
    $type = [string]$record.fields."Type coefficient"
    if ($type -eq 'Saisonnalite') { $hasBaseRules = $true }
    if ($type -eq 'ForfaitKm') { $hasKmGrid = $true }
  }

  $rows = @()

  if (-not $hasBaseRules) {
    $rows += @(
    @{ "Type coefficient"='Saisonnalite'; Nom='Basse saison'; Valeur='-7%'; Condition='Novembre, Janvier, Fevrier, Aout' },
    @{ "Type coefficient"='Saisonnalite'; Nom='Moyenne saison'; Valeur='0%'; Condition='Decembre, Octobre, Septembre' },
    @{ "Type coefficient"='Saisonnalite'; Nom='Haute saison'; Valeur='+10%'; Condition='Mars, Avril, Juillet' },
    @{ "Type coefficient"='Saisonnalite'; Nom='Tres haute saison'; Valeur='+15%'; Condition='Mai, Juin' },
    @{ "Type coefficient"='DateDemande'; Nom='DD_PRIORITAIRE'; Valeur='+10%'; Condition='DD_PRIORITAIRE' },
    @{ "Type coefficient"='DateDemande'; Nom='DD_URGENT'; Valeur='+5%'; Condition='DD_URGENT' },
    @{ "Type coefficient"='DateDemande'; Nom='DD_NORMAL'; Valeur='-5%'; Condition='DD_NORMAL' },
    @{ "Type coefficient"='DateDemande'; Nom='DD_3MOISETPLUS'; Valeur='-10%'; Condition='DD_3MOISETPLUS' },
    @{ "Type coefficient"='Capacite'; Nom='<= 19'; Valeur='-5%'; Condition='<= 19' },
    @{ "Type coefficient"='Capacite'; Nom='> 19 et <= 53'; Valeur='0%'; Condition='> 19 et <= 53' },
    @{ "Type coefficient"='Capacite'; Nom='> 53 et <= 63'; Valeur='+15%'; Condition='> 53 et <= 63' },
    @{ "Type coefficient"='Capacite'; Nom='> 63 et <= 67'; Valeur='+20%'; Condition='> 63 et <= 67' },
    @{ "Type coefficient"='Capacite'; Nom='> 67 et <= 85'; Valeur='+40%'; Condition='> 67 et <= 85' },
    @{ "Type coefficient"='Supplement'; Nom='Guide / accompagnateur'; Valeur='80'; Condition='par jour' },
    @{ "Type coefficient"='Supplement'; Nom='Nuit chauffeur'; Valeur='120'; Condition='par nuit' },
    @{ "Type coefficient"='Fiscalite'; Nom='TVA'; Valeur='10%'; Condition='global' },
    @{ "Type coefficient"='Fiscalite'; Nom='Marge commerciale'; Valeur='15%'; Condition='global' }
    )
  }

  if (-not $hasKmGrid) {
    $rows += @(
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 10 km'; Valeur='250'; Condition='<= 10'; km=10 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 20 km'; Valeur='250'; Condition='<= 20'; km=20 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 30 km'; Valeur='250'; Condition='<= 30'; km=30 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 40 km'; Valeur='320'; Condition='<= 40'; km=40 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 50 km'; Valeur='350'; Condition='<= 50'; km=50 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 60 km'; Valeur='390'; Condition='<= 60'; km=60 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 70 km'; Valeur='430'; Condition='<= 70'; km=70 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 80 km'; Valeur='500'; Condition='<= 80'; km=80 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 90 km'; Valeur='540'; Condition='<= 90'; km=90 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 100 km'; Valeur='580'; Condition='<= 100'; km=100 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 110 km'; Valeur='620'; Condition='<= 110'; km=110 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 120 km'; Valeur='660'; Condition='<= 120'; km=120 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 130 km'; Valeur='700'; Condition='<= 130'; km=130 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 140 km'; Valeur='740'; Condition='<= 140'; km=140 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 150 km'; Valeur='780'; Condition='<= 150'; km=150 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 160 km'; Valeur='820'; Condition='<= 160'; km=160 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 170 km'; Valeur='860'; Condition='<= 170'; km=170 },
      @{ "Type coefficient"='ForfaitKm'; Nom='Jusqu a 180 km'; Valeur='900'; Condition='<= 180'; km=180 },
      @{ "Type coefficient"='ForfaitKmDepassement'; Nom='Au dela de 180 km'; Valeur='2.5'; Condition='(KM x 2) x 2,5 EUR / km parcourue'; km=181 }
    )
  }

  if ($rows.Count -eq 0) { return }

  $records = @()
  foreach ($row in $rows) {
    $records += @{ fields = $row }
  }

  $payload = @{ records = $records } | ConvertTo-Json -Depth 10
  Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Post -Body $payload | Out-Null
}

$demandesFields = @(
  @{ name='nomSociete'; type='singleLineText' },
  @{ name='email'; type='email' },
  @{ name='telephone'; type='phoneNumber' },
  @{ name='villeDepart'; type='singleLineText' },
  @{ name='villeDestination'; type='singleLineText' },
  @{ name='distanceKm'; type='number'; options=@{ precision=1 } },
  @{ name='dateDepart'; type='date'; options=@{ dateFormat=@{ name='local'; format='l' } } },
  @{ name='dateRetour'; type='date'; options=@{ dateFormat=@{ name='local'; format='l' } } },
  @{ name='dateDemande'; type='date'; options=@{ dateFormat=@{ name='local'; format='l' } } },
  @{ name='nombrePassagers'; type='number'; options=@{ precision=0 } },
  @{ name='typeVehicule'; type='singleSelect'; options=@{ choices=@(@{name='Minibus'}, @{name='Autocar'}, @{name='Bus VIP'}) } },
  @{ name='typeTrajet'; type='singleSelect'; options=@{ choices=@(@{name='Aller simple'}, @{name='Aller-retour'}, @{name='Multietapes'}) } },
  @{ name='options'; type='multipleSelects'; options=@{ choices=@(@{name='Guide'}, @{name='Nuit chauffeur'}, @{name='Peages inclus'}) } },
  @{ name='urgence'; type='singleSelect'; options=@{ choices=@(@{name='Prioritaire'}, @{name='Urgent'}, @{name='Normale'}, @{name='Anticipee'}) } },
  @{ name='commentaire'; type='multilineText' },
  @{ name='statut'; type='singleSelect'; options=@{ choices=@(@{name='Nouveau'}, @{name='En cours'}, @{name='Valide'}, @{name='Refuse'}) } }
)

$devisFields = @(
  @{ name='demandeLiee'; type='singleLineText' },
  @{ name='prixHt'; type='number'; options=@{ precision=2 } },
  @{ name='tva10'; type='number'; options=@{ precision=2 } },
  @{ name='prixTtc'; type='number'; options=@{ precision=2 } },
  @{ name='detailCalcul'; type='multilineText' },
  @{ name='pdfUrl'; type='url' },
  @{ name='pdfFileName'; type='singleLineText' },
  @{ name='statut'; type='singleSelect'; options=@{ choices=@(@{name='Brouillon'}, @{name='Envoye'}, @{name='Accepte'}, @{name='Refuse'}) } },
  @{ name='dateEnvoi'; type='date'; options=@{ dateFormat=@{ name='local'; format='l' } } },
  @{ name='prochaineRelance'; type='date'; options=@{ dateFormat=@{ name='local'; format='l' } } }
)

$relancesFields = @(
  @{ name='devisLie'; type='singleLineText' },
  @{ name='numeroRelance'; type='number'; options=@{ precision=0 } },
  @{ name='datePlanifiee'; type='date'; options=@{ dateFormat=@{ name='local'; format='l' } } },
  @{ name='statut'; type='singleSelect'; options=@{ choices=@(@{name='A planifier'}, @{name='Planifiee'}, @{name='Envoyee'}, @{name='Repondu'}, @{name='Sans reponse'}) } },
  @{ name='reponseProspect'; type='multilineText' }
)

$tarificationFields = @(
  @{ name='Type coefficient'; type='singleLineText' },
  @{ name='Nom'; type='singleLineText' },
  @{ name='Valeur'; type='singleLineText' },
  @{ name='Condition'; type='singleLineText' },
  @{ name='km'; type='number'; options=@{ precision=0 } }
)

$demandesId = Ensure-Table 'Demandes' $demandesFields
$devisId = Ensure-Table 'Devis' $devisFields
$relancesId = Ensure-Table 'Relances' $relancesFields
$tarificationId = Ensure-Table 'Tarification' $tarificationFields

Ensure-Field $demandesId 'nomSociete' 'singleLineText' $null
Ensure-Field $demandesId 'email' 'email' $null
Ensure-Field $demandesId 'telephone' 'phoneNumber' $null
Ensure-Field $demandesId 'villeDepart' 'singleLineText' $null
Ensure-Field $demandesId 'villeDestination' 'singleLineText' $null
Ensure-Field $demandesId 'distanceKm' 'number' @{ precision=1 }
Ensure-Field $demandesId 'dateDepart' 'date' @{ dateFormat=@{ name='local'; format='l' } }
Ensure-Field $demandesId 'dateRetour' 'date' @{ dateFormat=@{ name='local'; format='l' } }
Ensure-Field $demandesId 'dateDemande' 'date' @{ dateFormat=@{ name='local'; format='l' } }
Ensure-Field $demandesId 'nombrePassagers' 'number' @{ precision=0 }
Ensure-Field $demandesId 'typeVehicule' 'singleSelect' @{ choices=@(@{name='Minibus'}, @{name='Autocar'}, @{name='Bus VIP'}) }
Ensure-Field $demandesId 'typeTrajet' 'singleSelect' @{ choices=@(@{name='Aller simple'}, @{name='Aller-retour'}, @{name='Multietapes'}) }
Ensure-Field $demandesId 'options' 'multipleSelects' @{ choices=@(@{name='Guide'}, @{name='Nuit chauffeur'}, @{name='Peages inclus'}) }
Ensure-Field $demandesId 'urgence' 'singleSelect' @{ choices=@(@{name='Prioritaire'}, @{name='Urgent'}, @{name='Normale'}, @{name='Anticipee'}) }
Ensure-Field $demandesId 'commentaire' 'multilineText' $null
Ensure-Field $demandesId 'statut' 'singleSelect' @{ choices=@(@{name='Nouveau'}, @{name='En cours'}, @{name='Valide'}, @{name='Refuse'}) }

Ensure-Field $devisId 'demandeLiee' 'singleLineText' $null
Ensure-Field $devisId 'prixHt' 'number' @{ precision=2 }
Ensure-Field $devisId 'tva10' 'number' @{ precision=2 }
Ensure-Field $devisId 'prixTtc' 'number' @{ precision=2 }
Ensure-Field $devisId 'detailCalcul' 'multilineText' $null
Ensure-Field $devisId 'pdfUrl' 'url' $null
Ensure-Field $devisId 'pdfFileName' 'singleLineText' $null
Ensure-Field $devisId 'statut' 'singleSelect' @{ choices=@(@{name='Brouillon'}, @{name='Envoye'}, @{name='Accepte'}, @{name='Refuse'}) }
Ensure-Field $devisId 'dateEnvoi' 'date' @{ dateFormat=@{ name='local'; format='l' } }
Ensure-Field $devisId 'prochaineRelance' 'date' @{ dateFormat=@{ name='local'; format='l' } }

Ensure-Field $relancesId 'devisLie' 'singleLineText' $null
Ensure-Field $relancesId 'numeroRelance' 'number' @{ precision=0 }
Ensure-Field $relancesId 'datePlanifiee' 'date' @{ dateFormat=@{ name='local'; format='l' } }
Ensure-Field $relancesId 'statut' 'singleSelect' @{ choices=@(@{name='A planifier'}, @{name='Planifiee'}, @{name='Envoyee'}, @{name='Repondu'}, @{name='Sans reponse'}) }
Ensure-Field $relancesId 'reponseProspect' 'multilineText' $null

Ensure-Field $tarificationId 'Type coefficient' 'singleLineText' $null
Ensure-Field $tarificationId 'Nom' 'singleLineText' $null
Ensure-Field $tarificationId 'Valeur' 'singleLineText' $null
Ensure-Field $tarificationId 'Condition' 'singleLineText' $null
Ensure-Field $tarificationId 'km' 'number' @{ precision=0 }

Ensure-TarificationSeed 'Tarification'

$tables = Get-Tables
$tables.tables | Select-Object name, id | Format-Table | Out-String
