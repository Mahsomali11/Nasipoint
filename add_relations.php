<?php

function addRelations($path, $relations) {
    if (!file_exists($path)) return;
    $content = file_get_contents($path);
    if (!str_contains($content, 'function ')) {
        $content = str_replace('}', "\n$relations\n}", $content);
        file_put_contents($path, $content);
        echo "Updated $path\n";
    }
}

addRelations('app/Models/Store.php', "    public function profiles() { return \$this->belongsTo(User::class, 'owner_user_id'); }");
addRelations('app/Models/License.php', "    public function plans() { return \$this->belongsTo(Plan::class, 'plan_id'); }");
addRelations('app/Models/Subscription.php', "    public function plans() { return \$this->belongsTo(Plan::class, 'plan_id'); }\n    public function stores() { return \$this->belongsTo(Store::class, 'store_id'); }");
addRelations('app/Models/PlatformPayment.php', "    public function stores() { return \$this->belongsTo(Store::class, 'store_id'); }");
addRelations('app/Models/SupportTicket.php', "    public function stores() { return \$this->belongsTo(Store::class, 'store_id'); }\n    public function profiles() { return \$this->belongsTo(User::class, 'user_id'); }");
addRelations('app/Models/Sale.php', "    public function stores() { return \$this->belongsTo(Store::class, 'store_id'); }");
