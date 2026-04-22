from django.db import migrations

INITIAL_FEATURES = [
    ("profile_standalone_races", "free", "Corridas Avulsas & Treinos"),
    ("profile_badges", "free", "Conquistas"),
    ("profile_social_links", "free", "Redes Sociais"),
    ("profile_stats", "free", "Estatísticas Detalhadas"),
    ("profile_website", "plus", "Website Pessoal"),
]


def seed_features(apps, schema_editor):
    FeatureVisibility = apps.get_model("admin_panel", "FeatureVisibility")
    for feature_key, min_tier, label in INITIAL_FEATURES:
        FeatureVisibility.objects.get_or_create(
            feature_key=feature_key,
            defaults={"min_tier": min_tier, "label": label},
        )


def unseed_features(apps, schema_editor):
    FeatureVisibility = apps.get_model("admin_panel", "FeatureVisibility")
    keys = [f[0] for f in INITIAL_FEATURES]
    FeatureVisibility.objects.filter(feature_key__in=keys).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("admin_panel", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_features, reverse_code=unseed_features),
    ]
