from django.db import models

#tabela piloto
class PilotProfile(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

#follow
class Follow(models.Model):
    follower  = models.ForeignKey(PilotProfile, related_name='following_set', on_delete=models.CASCADE)
    following = models.ForeignKey(PilotProfile, related_name='followers_set', on_delete=models.CASCADE) 
#não segue duas vezes
    class Meta:
        unique_together = ('follower', 'following')

#lugar corrida
class Track(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)

    def __str__(self):
        return self.name


#corrida
class Race(models.Model):
    MODALITY_CHOICES = [
        ('rental', 'Rental'),
        ('profissional', 'Profissional'),
        ('endurance', 'Endurance'),
    ]
    pilot              = models.ForeignKey(PilotProfile, on_delete=models.CASCADE, related_name='races')
    track              = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='races')
    race_date          = models.DateField()
    category           = models.CharField(max_length=100)
    modality           = models.CharField(max_length=20, choices=MODALITY_CHOICES)
    position_finished  = models.IntegerField()
    total_competitors  = models.IntegerField()
    best_lap_time      = models.IntegerField(help_text='Em milissegundos')
    total_time         = models.IntegerField(help_text='Em milissegundos')
    notes              = models.TextField(blank=True, default='')
    is_public          = models.BooleanField(default=True)
    def __str__(self):
        return f'{self.pilot} - {self.track} - {self.race_date}'